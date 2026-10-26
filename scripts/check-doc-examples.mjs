import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createProcessor } from '@mdx-js/mdx';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.dirname(site);
const docs = path.join(site, 'app/assets/docs/v1.1.0');
const processor = createProcessor();
function snippets(file) {
  const tree = processor.parse(fs.readFileSync(path.join(docs, file), 'utf8'));
  return tree.children.filter((node) => node.type === 'code' && ['ts', 'typescript'].includes(node.lang)).map((node) => node.value);
}
const cache = path.join(site, 'node_modules/.cache/docs-examples');
fs.mkdirSync(cache, { recursive: true });
const directory = fs.mkdtempSync(path.join(cache, 'case-'));
let checked = 0;
function write(file, source) {
  const target = path.join(directory, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
  checked++;
}
function inAsyncFunction(code) {
  const lines = code.split('\n');
  const imports = lines.filter((line) => /^import /.test(line));
  const body = lines.filter((line) => !/^import /.test(line));
  return `${imports.join('\n')}\nasync function example() {\n${body.join('\n')}\n}\n`;
}
try {
  const recipe = snippets('getting-started/application-recipe.mdx');
  for (const code of recipe.slice(0, 3)) {
    const file = code.match(/^\/\/ (src\/[^\n]+)/)?.[1].trim();
    assert.ok(file, 'A recipe file needs its documented filename');
    write(file, code);
  }
  write('src/routes/me/me.route.ts', recipe[3]);
  write('src/models/user.model.ts', snippets('packages/database-crud.mdx')[0]);
  write('src/models/post.model.ts', snippets('packages/database-models.mdx')[1]);
  for (const [index, code] of snippets('packages/common-encryption.mdx').entries()) {
    const imports = index === 0 ? '' : "import { encryption } from '@flutry/common';\n";
    write(`src/examples/encryption-${index}.ts`, inAsyncFunction(imports + code));
  }
  for (const [index, code] of snippets('packages/rate-limit.mdx').entries()) write(`src/examples/rate-limit-${index}.ts`, code);
  const dependencies = {
    '@flutry/server': path.join(workspace, 'package/server'),
    '@flutry/common': path.join(workspace, 'package/common'),
    '@flutry/redis': path.join(workspace, 'package/redis'),
    '@flutry/database-sequlize': path.join(workspace, 'package/database-sequlize'),
    '@types/node': path.join(site, 'node_modules/@types/node'),
    dotenv: path.join(workspace, 'flutry/node_modules/dotenv'),
  };
  for (const [name, target] of Object.entries(dependencies)) {
    const link = path.join(directory, 'node_modules', name);
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  }
  fs.writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2020', module: 'CommonJS', moduleResolution: 'node', esModuleInterop: true,
      strict: true, skipLibCheck: true, noEmit: true, types: ['node'],
    },
    include: ['src/**/*.ts'],
  }));
  const result = spawnSync(process.execPath, [path.join(site, 'node_modules/typescript/bin/tsc'), '-p', path.join(directory, 'tsconfig.json')], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  console.log(`Type-checked ${checked} documentation example files against local framework declarations.`);
} finally {
  if (path.dirname(path.resolve(directory)) !== cache) throw new Error('Unexpected example cleanup path');
  fs.rmSync(directory, { recursive: true, force: true });
}
