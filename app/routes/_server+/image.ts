import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import sharp from 'sharp';
import type { LoaderFunction } from 'react-router';

const MAX_SIZE = 2500;
const MAX_REMOTE_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
const REMOTE_FETCH_TIMEOUT = 5000;
const SHARP_PROCESS_TIMEOUT = 15000;
const MAX_CONCURRENT_TRANSFORMS = 4;

/**
 * --------------------------------------------------
 * ALLOWLIST (opcionális, de erősen ajánlott)
 * --------------------------------------------------
 *
 * Ha be van állítva az ALLOWED_REMOTE_IMAGE_HOSTS env
 * változó (vesszővel elválasztott hostnevek), akkor
 * KIZÁRÓLAG ezekről a hostokról engedünk remote képet
 * letölteni. Ez a legerősebb védelem SSRF ellen.
 *
 * A privát IP-ellenőrzés (lásd lejjebb) mindig fut,
 * függetlenül attól, hogy van-e allowlist beállítva.
 */
const ALLOWED_REMOTE_HOSTS = (process.env.ALLOWED_REMOTE_IMAGE_HOSTS || '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

/**
 * --------------------------------------------------
 * IMAGE CACHE
 * --------------------------------------------------
 */

/**
 * Cache entry törlődik, ha 20 percig nem használták.
 */
const IMAGE_CACHE_TTL = 20 * 60 * 1000;

/**
 * Cache cleanup 5 percenként.
 */
const IMAGE_CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Maximum teljes cache méret:
 * 10 GiB
 */
const IMAGE_CACHE_MAX_SIZE = 10 * 1024 * 1024 * 1024;

/**
 * Ha elérjük a 10 GiB limitet,
 * eddig takarítjuk vissza.
 *
 * Így nem kell minden új cache fájlnál
 * azonnal újra cleanupot futtatni.
 */
const IMAGE_CACHE_TARGET_SIZE = 9 * 1024 * 1024 * 1024;

/**
 * --------------------------------------------------
 * HTTP CACHE
 * --------------------------------------------------
 *
 * 5 perc browser + Cloudflare cache.
 *
 * Nem használunk immutable-t, mert ugyanaz
 * az URL mögött megváltozhat az eredeti kép.
 */
const HTTP_CACHE_TTL = 5 * 60;

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const IMAGE_CACHE_DIR = path.resolve(process.cwd(), '.image-cache');

/**
 * --------------------------------------------------
 * SHARP
 * --------------------------------------------------
 */

sharp.cache({
  memory: 100,
  files: 200,
  items: 500,
});

sharp.simd(true);

/**
 * FIX: sharp.concurrency(0) = "annyi szál, ahány CPU mag van",
 * ÉS minden egyes kép a saját szálkészletét próbálja használni.
 * Sok párhuzamos kérésnél ez CPU-túljegyzéshez vezet.
 *
 * Fix szálszám + a lejjebbi Semaphore együtt tartja kordában
 * a tényleges egyidejű terhelést.
 */
sharp.concurrency(2);

/**
 * Ugyanazon cache key egyidejű feldolgozását
 * egyetlen Sharp műveletre korlátozzuk.
 */
const pendingImages = new Map<string, Promise<Buffer>>();

/**
 * Ne fusson egyszerre több cleanup.
 */
let cleanupRunning = false;

/**
 * --------------------------------------------------
 * HIBAKEZELÉS
 * --------------------------------------------------
 *
 * FIX: eddig minden hiba egységesen 500-at dobott.
 * Most a hiba típusától függő státuszkódot adunk vissza,
 * és a hibaüzenetet nem szivárogtatjuk feleslegesen kifelé.
 */
class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * --------------------------------------------------
 * EGYIDEJŰSÉG LIMITÁLÁS (Semaphore)
 * --------------------------------------------------
 *
 * FIX: korábban semmi nem korlátozta, hány Sharp
 * feldolgozás fusson párhuzamosan. Sok egyidejű,
 * cache-ben nem lévő kép request alatt ez memória-
 * és CPU-kimerüléshez, instabilitáshoz vezethetett.
 */
class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.max) {
      this.active++;

      return () => this.release();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active++;

        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.active--;

    const next = this.queue.shift();

    if (next) {
      next();
    }
  }
}

const transformSemaphore = new Semaphore(MAX_CONCURRENT_TRANSFORMS);

/**
 * --------------------------------------------------
 * HELPERS
 * --------------------------------------------------
 */

function getContentType(format: 'avif' | 'webp' | 'jpeg'): string {
  switch (format) {
    case 'avif':
      return 'image/avif';

    case 'webp':
      return 'image/webp';

    default:
      return 'image/jpeg';
  }
}

function detectFormat(request: Request, forced?: string | null): 'avif' | 'webp' | 'jpeg' {
  if (forced) {
    const format = forced.toLowerCase();

    if (format === 'avif') {
      return 'avif';
    }

    if (format === 'webp') {
      return 'webp';
    }

    if (format === 'jpeg' || format === 'jpg') {
      return 'jpeg';
    }
  }

  const accept = request.headers.get('accept') || '';

  if (accept.includes('image/avif')) {
    return 'avif';
  }

  if (accept.includes('image/webp')) {
    return 'webp';
  }

  return 'jpeg';
}

function parseDimension(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(Math.floor(parsed), MAX_SIZE);
}

function parseQuality(value: string | null): number {
  if (!value) {
    return 80;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 80;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

function getCachePath(cacheKey: string): string {
  return path.join(IMAGE_CACHE_DIR, cacheKey);
}

/**
 * FIX: a helyi path feloldás + traversal-védelem eddig
 * két helyen (loadLocalImage + loader) volt duplikálva.
 * Ez egy közös helyre került, hogy ne csúszhasson szét.
 */
function resolveLocalPath(src: string): string {
  const normalizedSource = src.replace(/^\/+/, '');

  const resolvedPath = path.resolve(PUBLIC_DIR, normalizedSource);

  const relativePath = path.relative(PUBLIC_DIR, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new HttpError(400, 'Invalid image path');
  }

  return resolvedPath;
}

/**
 * --------------------------------------------------
 * SSRF VÉDELEM
 * --------------------------------------------------
 *
 * FIX: a remote kép betöltés korábban bármilyen
 * user-megadott URL-t lekérdezett, így egy támadó
 * a szerveren keresztül elérhetett volna belső
 * hálózati címeket / cloud metadata endpointokat
 * (pl. http://169.254.169.254/...).
 *
 * Megjegyzés: ez a check a DNS feloldás pillanatában
 * érvényes címeket ellenőrzi (klasszikus TOCTOU / DNS
 * rebinding kockázat elméletileg fennáll). Ahol lehet,
 * használjuk az ALLOWED_REMOTE_IMAGE_HOSTS allowlistet
 * elsődleges védelemként, ez a check csak second layer.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '::') return true; // loopback / unspecified
  if (normalized.startsWith('fe80:')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local fc00::/7

  if (normalized.startsWith('::ffff:')) {
    return isPrivateIPv4(normalized.replace('::ffff:', ''));
  }

  return false;
}

async function assertPublicRemoteHost(hostname: string): Promise<void> {
  const lowerHost = hostname.toLowerCase();

  if (lowerHost === 'localhost') {
    throw new HttpError(400, 'Invalid image source');
  }

  if (ALLOWED_REMOTE_HOSTS.length > 0 && !ALLOWED_REMOTE_HOSTS.includes(lowerHost)) {
    throw new HttpError(400, 'Invalid image source');
  }

  const ipVersion = net.isIP(lowerHost);

  if (ipVersion === 4) {
    if (isPrivateIPv4(lowerHost)) {
      throw new HttpError(400, 'Invalid image source');
    }

    return;
  }

  if (ipVersion === 6) {
    if (isPrivateIPv6(lowerHost)) {
      throw new HttpError(400, 'Invalid image source');
    }

    return;
  }

  let records: Array<{ address: string; family: number }>;

  try {
    records = await dns.lookup(lowerHost, { all: true, verbatim: true });
  } catch {
    throw new HttpError(400, 'Could not resolve image host');
  }

  if (records.length === 0) {
    throw new HttpError(400, 'Could not resolve image host');
  }

  for (const record of records) {
    if (record.family === 4 && isPrivateIPv4(record.address)) {
      throw new HttpError(400, 'Invalid image source');
    }

    if (record.family === 6 && isPrivateIPv6(record.address)) {
      throw new HttpError(400, 'Invalid image source');
    }
  }
}

/**
 * FIX: a méretkorlátot eddig csak a Content-Length
 * headerre (hazudhat) és a TELJES letöltés UTÁN
 * ellenőriztük. Most streamelve, chunkonként számoljuk,
 * és a limit túllépésekor azonnal megszakítjuk a letöltést.
 */
async function readBodyWithLimit(response: Response, limit: number): Promise<Buffer> {
  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > limit) {
      throw new HttpError(413, 'Remote image is too large');
    }

    return buffer;
  }

  const reader = response.body.getReader();

  const chunks: Uint8Array[] = [];

  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      total += value.byteLength;

      if (total > limit) {
        await reader.cancel().catch(() => {});

        throw new HttpError(413, 'Remote image is too large');
      }

      chunks.push(value);
    }
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

/**
 * --------------------------------------------------
 * SOURCE LOADING
 * --------------------------------------------------
 */

/**
 * Helyi kép betöltése.
 *
 * A version az eredeti fájl mtime + size értékéből
 * készül, így ha ugyanaz a fájlnév mögött új kép
 * jelenik meg, új cache key keletkezik.
 */
async function loadLocalImage(src: string): Promise<{
  buffer: Buffer;
  version: string;
}> {
  const resolvedPath = resolveLocalPath(src);

  let stat;

  try {
    stat = await fs.stat(resolvedPath);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new HttpError(404, 'Image not found');
    }

    throw error;
  }

  if (!stat.isFile()) {
    throw new HttpError(400, 'Image source is not a file');
  }

  /**
   * mtime + fájlméret.
   *
   * Nem hash-eljük végig minden requestnél
   * az eredeti képet, mert az fölösleges I/O lenne.
   */
  const version = `${stat.mtimeMs}:${stat.size}`;

  const buffer = await fs.readFile(resolvedPath);

  return {
    buffer,
    version,
  };
}

/**
 * Remote kép betöltése.
 */
async function loadRemoteImage(src: string): Promise<{
  buffer: Buffer;
  version: string;
}> {
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    throw new HttpError(400, 'Invalid image source');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(400, 'Invalid image source');
  }

  await assertPublicRemoteHost(url.hostname);

  let response: Response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(REMOTE_FETCH_TIMEOUT),
      redirect: 'follow',
    });
  } catch (error) {
    throw new HttpError(502, 'Failed to fetch remote image');
  }

  if (!response.ok) {
    throw new HttpError(502, `Image fetch failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.startsWith('image/')) {
    throw new HttpError(400, 'Remote resource is not an image');
  }

  const contentLength = response.headers.get('content-length');

  if (contentLength) {
    const size = Number(contentLength);

    if (Number.isFinite(size) && size > MAX_REMOTE_IMAGE_SIZE) {
      throw new HttpError(413, 'Remote image is too large');
    }
  }

  const buffer = await readBodyWithLimit(response, MAX_REMOTE_IMAGE_SIZE);

  /**
   * Remote szervernél az ETag / Last-Modified
   * lehet a verzió.
   */
  const etag = response.headers.get('etag');

  const lastModified = response.headers.get('last-modified');

  const version = etag || lastModified || src;

  return {
    buffer,
    version,
  };
}

async function loadImage(src: string): Promise<{
  buffer: Buffer;
  version: string;
}> {
  if (/^https?:\/\//i.test(src)) {
    return loadRemoteImage(src);
  }

  return loadLocalImage(src);
}

/**
 * --------------------------------------------------
 * CACHE READ
 * --------------------------------------------------
 */

async function getCachedImage(cacheKey: string): Promise<Buffer | null> {
  const filePath = getCachePath(cacheKey);

  try {
    const output = await fs.readFile(filePath);

    /**
     * Cache hit → frissítjük az utolsó
     * használat idejét.
     */
    const now = new Date();

    try {
      await fs.utimes(filePath, now, now);
    } catch {
      /**
       * Az időbélyeg frissítésének hibája
       * ne tegye tönkre a cache hitet.
       */
    }

    return output;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

/**
 * --------------------------------------------------
 * CACHE WRITE
 * --------------------------------------------------
 */

async function saveCachedImage(cacheKey: string, buffer: Buffer): Promise<void> {
  await fs.mkdir(IMAGE_CACHE_DIR, {
    recursive: true,
  });

  const filePath = getCachePath(cacheKey);

  /**
   * Temporary fájl.
   *
   * Így más request nem tud félkész képet
   * olvasni.
   */
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;

  try {
    await fs.writeFile(temporaryPath, buffer);

    /**
     * Atomic rename.
     */
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(temporaryPath);
    } catch {
      // Ignore cleanup failure.
    }

    /**
     * Ha egy másik process már létrehozta,
     * akkor a cache ettől még használható.
     */
    try {
      await fs.access(filePath);
    } catch {
      throw error;
    }
  }
}

/**
 * --------------------------------------------------
 * IMAGE PROCESSING
 * --------------------------------------------------
 */

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new HttpError(504, message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function processImage(
  cacheKey: string,
  src: string,
  width: number,
  height: number,
  quality: number,
  format: 'avif' | 'webp' | 'jpeg',
): Promise<Buffer> {
  /**
   * Ha valaki már dolgozik ugyanazon
   * a képen, ugyanazt a Promise-t használjuk.
   */
  const existingTask = pendingImages.get(cacheKey);

  if (existingTask) {
    return existingTask;
  }

  const task = (async () => {
    /**
     * Második cache check.
     *
     * Fontos párhuzamos requesteknél.
     */
    const cached = await getCachedImage(cacheKey);

    if (cached) {
      return cached;
    }

    const { buffer: input } = await loadImage(src);

    /**
     * FIX: a tényleges Sharp-feldolgozást (ami CPU/memória
     * igényes) egy Semaphore mögé tettük, hogy sok egyidejű
     * cache-miss ne terhelje túl a szervert.
     */
    const release = await transformSemaphore.acquire();

    try {
      let image = sharp(input, {
        limitInputPixels: 16777216,
        sequentialRead: true,
        // FIX: sérült/hibás bemenet esetén tiszta hibát dobjon,
        // ne akadjon el csendben.
        failOn: 'error',
      });

      /**
       * Resize.
       */
      if (width || height) {
        image = image.resize(width || undefined, height || undefined, {
          fit: 'cover',
          withoutEnlargement: true,
          fastShrinkOnLoad: true,
        });
      }

      /**
       * Encoding.
       */
      switch (format) {
        case 'avif':
          image = image.avif({
            quality,
            effort: 2,
          });
          break;

        case 'webp':
          image = image.webp({
            quality,
            effort: 3,
          });
          break;

        default:
          image = image.jpeg({
            quality,
            mozjpeg: true,
            progressive: true,
          });
          break;
      }

      let output: Buffer;

      try {
        output = await withTimeout(image.toBuffer(), SHARP_PROCESS_TIMEOUT, 'Image processing timed out');
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }

        // FIX: sharp hibáit (pl. sérült kép) 400-ként kezeljük,
        // nem szerverhibaként.
        throw new HttpError(400, 'Could not process image');
      }

      /**
       * A cache mentési hiba ne okozzon
       * 500-at egy egyébként sikeres kép miatt.
       */
      try {
        await saveCachedImage(cacheKey, output);
      } catch (error) {
        console.error('[ImageCache] Failed to save:', error);
      }

      return output;
    } finally {
      release();
    }
  })();

  pendingImages.set(cacheKey, task);

  try {
    return await task;
  } finally {
    pendingImages.delete(cacheKey);
  }
}

/**
 * --------------------------------------------------
 * CACHE CLEANUP
 * --------------------------------------------------
 */

async function cleanupImageCache(): Promise<void> {
  if (cleanupRunning) {
    return;
  }

  cleanupRunning = true;

  try {
    await fs.mkdir(IMAGE_CACHE_DIR, {
      recursive: true,
    });

    const entries = await fs.readdir(IMAGE_CACHE_DIR, {
      withFileTypes: true,
    });

    const now = Date.now();

    const files: Array<{
      path: string;
      size: number;
      mtimeMs: number;
    }> = [];

    let totalSize = 0;

    /**
     * --------------------------------------------------
     * CACHE MÉRET ÖSSZEGYŰJTÉSE
     * --------------------------------------------------
     */

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isFile()) {
          return;
        }

        /**
         * Temporary fájlokat külön kezeljük.
         */
        if (entry.name.endsWith('.tmp')) {
          const filePath = path.join(IMAGE_CACHE_DIR, entry.name);

          try {
            const stat = await fs.stat(filePath);

            /**
             * Elárvult temporary fájlok
             * is legyenek takarítva.
             */
            if (now - stat.mtimeMs > IMAGE_CACHE_TTL) {
              await fs.unlink(filePath);
            }
          } catch {
            // Ignore race conditions.
          }

          return;
        }

        const filePath = path.join(IMAGE_CACHE_DIR, entry.name);

        try {
          const stat = await fs.stat(filePath);

          files.push({
            path: filePath,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
          });

          totalSize += stat.size;
        } catch {
          /**
           * Ha a fájl közben eltűnt,
           * kihagyjuk.
           */
        }
      }),
    );

    /**
     * --------------------------------------------------
     * 1. TTL CLEANUP
     * --------------------------------------------------
     *
     * 20 percnél régebben nem használt
     * képek törlése.
     */
    const activeFiles: typeof files = [];

    for (const file of files) {
      if (now - file.mtimeMs > IMAGE_CACHE_TTL) {
        try {
          await fs.unlink(file.path);

          totalSize -= file.size;
        } catch {
          /**
           * Másik request/process már
           * törölhette.
           */
        }
      } else {
        activeFiles.push(file);
      }
    }

    /**
     * --------------------------------------------------
     * 2. MAXIMUM MÉRET
     * --------------------------------------------------
     *
     * Ha 10 GiB fölé ment a cache,
     * a legrégebben használt fájlokat
     * kezdjük el törölni.
     */
    if (totalSize > IMAGE_CACHE_MAX_SIZE) {
      /**
       * Legöregebb → legújabb.
       */
      activeFiles.sort((a, b) => a.mtimeMs - b.mtimeMs);

      for (const file of activeFiles) {
        /**
         * 9 GiB-nál megállunk.
         */
        if (totalSize <= IMAGE_CACHE_TARGET_SIZE) {
          break;
        }

        try {
          await fs.unlink(file.path);

          totalSize -= file.size;
        } catch {
          /**
           * Másik process már törölhette.
           */
        }
      }
    }

    //console.debug(`[ImageCache] ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GiB used`);
  } catch (error) {
    console.error('[ImageCache] Cleanup failed:', error);
  } finally {
    cleanupRunning = false;
  }
}

/**
 * --------------------------------------------------
 * BACKGROUND CLEANUP
 * --------------------------------------------------
 */

const cleanupTimer = setInterval(() => {
  void cleanupImageCache();
}, IMAGE_CACHE_CLEANUP_INTERVAL);

/**
 * Ne tartsa életben a timer
 * a Node.js processt.
 */
cleanupTimer.unref();

/**
 * Induláskor is legyen egy cleanup.
 */
void cleanupImageCache();

/**
 * --------------------------------------------------
 * LOADER
 * --------------------------------------------------
 */

export const loader: LoaderFunction = async ({ request }) => {
  const noStoreHeaders = {
    'Cache-Control': 'no-store',
  };

  try {
    const url = new URL(request.url);

    const src = url.searchParams.get('src');

    if (!src) {
      return new Response('Missing src', {
        status: 400,
        headers: noStoreHeaders,
      });
    }

    const width = parseDimension(url.searchParams.get('w'));

    const height = parseDimension(url.searchParams.get('h'));

    const quality = parseQuality(url.searchParams.get('q'));

    const format = detectFormat(request, url.searchParams.get('format'));

    /**
     * --------------------------------------------------
     * SOURCE VERSION
     * --------------------------------------------------
     *
     * Helyi képnél:
     * mtime + size
     *
     * Ez biztosítja, hogy ha például:
     *
     * /anime/naruto.jpg
     *
     * lecserélődik, akkor új cache key
     * keletkezzen.
     *
     * FIX: a path feloldás mostantól a közös
     * resolveLocalPath()-on megy át, hogy ne
     * csúszhasson szét a loadLocalImage()-ben
     * lévő logikától.
     */

    let sourceVersion: string;

    if (/^https?:\/\//i.test(src)) {
      /**
       * Remote képnél az URL az alap verzió.
       *
       * ETag / Last-Modified ellenőrzése
       * a remote fetch során történik.
       */
      sourceVersion = src;
    } else {
      const resolvedPath = resolveLocalPath(src);

      let stat;

      try {
        stat = await fs.stat(resolvedPath);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          throw new HttpError(404, 'Image not found');
        }

        throw error;
      }

      if (!stat.isFile()) {
        throw new HttpError(400, 'Image source is not a file');
      }

      sourceVersion = `${stat.mtimeMs}:${stat.size}`;
    }

    /**
     * --------------------------------------------------
     * CACHE KEY
     * --------------------------------------------------
     *
     * FIX: JSON.stringify-jal szerializálunk join('|')
     * helyett, hogy elkerüljük az elméleti ütközést, ha
     * valamelyik érték '|' karaktert tartalmazna.
     */

    const cacheKey = crypto
      .createHash('sha256')
      .update(JSON.stringify([src, sourceVersion, width, height, quality, format]))
      .digest('hex');

    const etag = `"${cacheKey}"`;

    /**
     * --------------------------------------------------
     * RESPONSE HEADERS
     * --------------------------------------------------
     */

    const headers = {
      'Content-Type': getContentType(format),

      ETag: etag,

      /**
       * Browser cache:
       * 5 perc
       */
      'Cache-Control': `public, max-age=${HTTP_CACHE_TTL}, must-revalidate`,

      /**
       * Cloudflare:
       * 5 perc
       */
      'CDN-Cache-Control': `public, max-age=${HTTP_CACHE_TTL}, must-revalidate`,

      /**
       * A formátum az Accept alapján
       * változhat.
       */
      Vary: 'Accept',

      'X-Image-Format': format,
    };

    /**
     * --------------------------------------------------
     * ETAG VALIDATION
     * --------------------------------------------------
     */

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    /**
     * --------------------------------------------------
     * DISK CACHE
     * --------------------------------------------------
     */

    let output = await getCachedImage(cacheKey);

    /**
     * --------------------------------------------------
     * CACHE MISS
     * --------------------------------------------------
     */

    if (!output) {
      output = await processImage(cacheKey, src, width, height, quality, format);
    }

    /**
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return new Response(new Uint8Array(output), {
      status: 200,
      headers,
    });
  } catch (error) {
    /**
     * FIX: HttpError esetén a megfelelő státuszkóddal
     * válaszolunk (400/404/413/502/504), minden más
     * esetben marad az 500 "catch-all".
     */
    if (error instanceof HttpError) {
      console.error(`[ImageLoader] ${error.status}:`, error.message);

      return new Response(error.message, {
        status: error.status,
        headers: noStoreHeaders,
      });
    }

    console.error('[ImageLoader] Image processing failed:', error);

    return new Response('Image processing failed', {
      status: 500,
      headers: noStoreHeaders,
    });
  }
};
