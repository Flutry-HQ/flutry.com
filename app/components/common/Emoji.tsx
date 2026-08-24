import { memo, useEffect, useState } from 'react';

import spriteSheet16 from 'emoji-datasource-twitter/img/twitter/sheets-256/16.png';
import spriteSheet20 from 'emoji-datasource-twitter/img/twitter/sheets-256/20.png';
import spriteSheet32 from 'emoji-datasource-twitter/img/twitter/sheets-256/32.png';
import spriteSheet64 from 'emoji-datasource-twitter/img/twitter/sheets-256/64.png';

type EmojiProps = {
  emoji: string;
  size: number;
  rounded?: boolean;
};

type EmojiMeta = {
  unified: string;
  sheet_x: number;
  sheet_y: number;
};

let emojiMap = new Map<string, EmojiMeta>();

let loaded = false;

let loading: Promise<void> | null = null;

function loadEmojiData() {
  if (loaded) return Promise.resolve();

  if (loading) return loading;

  loading = import('emoji-datasource-twitter/emoji_pretty.json').then((module) => {
    const data = module.default as EmojiMeta[];

    emojiMap = new Map();

    for (const item of data) {
      emojiMap.set(item.unified.toUpperCase(), item);
    }

    loaded = true;
  });

  return loading;
}

const unifiedCache = new Map<string, string>();

function emojiToUnified(emoji: string) {
  const cached = unifiedCache.get(emoji);

  if (cached) return cached;

  const unified = [...emoji]
    .map((char) => char.codePointAt(0)!.toString(16).toUpperCase())
    .join('-')
    .replace(/-FE0F/g, '');

  unifiedCache.set(emoji, unified);

  return unified;
}

const metaCache = new Map<string, EmojiMeta | null>();

function getEmojiMeta(emoji: string) {
  const cached = metaCache.get(emoji);

  if (cached !== undefined) {
    return cached;
  }

  const unified = emojiToUnified(emoji);

  const meta = emojiMap.get(unified) ?? emojiMap.get(`${unified}-FE0F`) ?? null;

  metaCache.set(emoji, meta);

  return meta;
}

function NewEmoji({ emoji, size, rounded = false }: EmojiProps) {
  const [ready, setReady] = useState(loaded);

  useEffect(() => {
    if (loaded) return;

    loadEmojiData().then(() => {
      setReady(true);
    });
  }, []);

  const type = size <= 16 ? spriteSheet16 : size <= 20 ? spriteSheet20 : size <= 32 ? spriteSheet32 : spriteSheet64;

  const CELL_SIZE = size <= 16 ? 16 : size <= 20 ? 20 : size <= 32 ? 32 : 64;

  if (!ready) {
    return (
      <span
        style={{
          width: size,
          height: size,
          display: 'inline-block',
        }}
      />
    );
  }

  const meta = getEmojiMeta(emoji);

  if (!meta) {
    return (
      <span
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size,
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    );
  }

  const BORDER = 1;
  const PITCH = CELL_SIZE + BORDER * 2;

  const x = meta.sheet_x * PITCH + BORDER;
  const y = meta.sheet_y * PITCH + BORDER;

  const scale = size / CELL_SIZE;

  const wrapperSize = rounded ? size * 0.7 : size;

  return (
    <div
      className={rounded ? 'flex items-center justify-center overflow-hidden rounded-full' : 'flex items-center justify-center overflow-hidden'}
      style={{
        width: wrapperSize,
        height: wrapperSize,
        minWidth: wrapperSize,
        minHeight: wrapperSize,
      }}
    >
      <span
        style={{
          display: 'block',
          width: CELL_SIZE,
          height: CELL_SIZE,
          minWidth: CELL_SIZE,
          minHeight: CELL_SIZE,
          backgroundImage: `url(${type})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: `-${x}px -${y}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      />
    </div>
  );
}

export default memo(NewEmoji, (prev, next) => prev.emoji === next.emoji && prev.size === next.size && prev.rounded === next.rounded);
