import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { createProcessor, compile, run } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.dirname(site);
const root = path.join(site, 'app/assets/docs');
const read = (name) => fs.readFileSync(name, 'utf8');
const json = (name) => JSON.parse(read(name));
const versions = json(path.join(root, 'meta.json')).versions;
const candidate = versions.find((version) => version.slug === 'v1.1.0');
assert.equal(candidate?.folder, 'v1.1.0');
assert.equal(candidate.index, 'Upgrading from v1.0.0 to v1.1.0');
assert.equal(versions.find((version) => version.slug === 'latest')?.folder, 'v1.0.0');
assert.ok(versions.some((version) => version.slug === 'v1.0.0' && version.folder === 'v1.0.0'));

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}

const sourceFiles = files(path.join(root, 'v1.0.0'));
const destination = path.join(root, candidate.folder);
for (const file of sourceFiles) assert.ok(fs.existsSync(path.join(destination, path.relative(path.join(root, 'v1.0.0'), file))), `Missing copied file: ${file}`);

const routes = new Set(['/docs']);
for (const version of versions) {
  const base = `/docs/${version.slug}`;
  routes.add(base);
  const meta = json(path.join(root, version.folder, 'meta.json'));
  for (const category of meta.categories) for (const item of category.items) {
    routes.add(`${base}/${category.slug}/${item.slug}`);
    assert.ok(fs.existsSync(path.join(root, version.folder, category.folder, `${item.slug}.mdx`)), `Missing navigation page: ${item.slug}`);
  }
}

const publicExports = new Map();
for (const name of ['server', 'common', 'redis', 'database-sequlize']) {
  const source = ts.createSourceFile('index.ts', read(path.join(workspace, 'package', name, 'src/index.ts')), ts.ScriptTarget.Latest, true);
  const names = new Set();
  for (const node of source.statements) if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
    for (const element of node.exportClause.elements) names.add(element.name.text);
  }
  publicExports.set(`@flutry/${name}`, names);
}

const environment = new Set(['PORT', 'HOST', 'PREFIX_API', 'NODE_ENV', 'DB', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_DIALECT', 'SECRET_KEY', 'SECRET_SALT', 'JWT_SECRET_KEY', 'JWT_EXPIRATION_TIME', 'LOG_LEVEL', 'SNOWFLAKE_MACHINE_ID', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'REDIS_PREFIX', 'RATE_LIMIT_ENABLED', 'RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW', 'RATE_LIMIT_REDIS', 'RATE_LIMIT_NAME']);
const processor = createProcessor();
const failures = [];
let links = 0, snippets = 0, historicalSnippets = 0, imports = 0, renderedPages = 0;
const candidateFiles = files(destination).filter((file) => file.endsWith('.mdx'));

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

for (const file of candidateFiles) {
  const relative = path.relative(destination, file).replaceAll('\\', '/');
  const source = read(file);
  const route = relative === 'index.mdx' ? '/docs/v1.1.0' : `/docs/v1.1.0/${relative.replace(/\.mdx$/, '')}`;
  assert.ok(routes.has(route), `Unreachable candidate page: ${relative}`);
  try {
    await compile(source);
    const module = await run(await compile(source, { outputFormat: 'function-body' }), jsxRuntime);
    const html = renderToStaticMarkup(createElement(module.default));
    if (relative === 'index.mdx') assert.match(html, /<h1>Upgrading from v1\.0\.0 to v1\.1\.0<\/h1>/);
    renderedPages++;
    const tree = processor.parse(source);
    visit(tree, (node) => {
      const location = `${relative}:${node.position?.start.line ?? 1}`;
      if (node.type === 'mdxTextExpression' || node.type === 'mdxFlowExpression') failures.push(`${location}: unescaped prose expression`);
      if (node.type === 'link' || node.type === 'image') {
        if (/^(https?:|mailto:|#)/.test(node.url)) return;
        const target = new URL(node.url, `https://docs.example${route}`);
        if (target.pathname.startsWith('/docs')) {
          links++;
          if (!routes.has(target.pathname.replace(/\/$/, ''))) failures.push(`${location}: unknown documentation link ${node.url}`);
        } else if (node.type === 'image' && !fs.existsSync(path.resolve(path.dirname(file), node.url))) {
          failures.push(`${location}: missing image ${node.url}`);
        }
      }
      if (node.type !== 'code') return;
      if (/before|historical/i.test(node.meta ?? '')) { historicalSnippets++; return; }
      if (['env', 'dotenv'].includes(node.lang)) {
        for (const key of Object.keys(parseEnv(node.value))) if (!environment.has(key)) failures.push(`${location}: unsupported environment variable ${key}`);
      }
      if (!['ts', 'typescript'].includes(node.lang)) return;
      snippets++;
      // Documented option fragments are valid only inside an options object.
      const code = /^\s*(socket|rateLimit):/.test(node.value) ? `const options = {${node.value}};` : node.value;
      const result = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
      for (const diagnostic of result.diagnostics ?? []) if (diagnostic.category === ts.DiagnosticCategory.Error) failures.push(`${location}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
      const ast = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true);
      for (const statement of ast.statements) if (ts.isImportDeclaration(statement)) {
        const available = publicExports.get(statement.moduleSpecifier.text);
        if (!available) continue;
        const bindings = statement.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) {
          imports++;
          const name = (binding.propertyName ?? binding.name).text;
          if (!available.has(name)) failures.push(`${location}: ${statement.moduleSpecifier.text} does not export ${name}`);
        }
      }
    });
  } catch (error) {
    failures.push(`${relative}: ${error.message}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log(JSON.stringify({ copiedFiles: sourceFiles.length, candidatePages: candidateFiles.length, renderedPages, internalLinks: links, syntaxCheckedTypeScriptSnippets: snippets, verifiedNamedImports: imports, historicalSnippets }, null, 2));
