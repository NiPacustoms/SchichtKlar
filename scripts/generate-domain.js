#!/usr/bin/env node
/**
 * Scaffolds a new Bounded Context under src/domain/<name>.
 * Usage: node scripts/generate-domain.js --name=myFeature
 *        npm run generate:domain -- --name=myFeature
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const nameArg = args.find((a) => a.startsWith('--name='));
const name = nameArg ? nameArg.replace('--name=', '').trim() : null;

if (!name || !/^[a-z][a-zA-Z0-9]*$/.test(name)) {
  console.error('Usage: npm run generate:domain -- --name=<featureName>');
  console.error('  featureName: camelCase, e.g. myFeature, report');
  process.exit(1);
}

const entityName = name.charAt(0).toUpperCase() + name.slice(1);

const root = path.resolve(__dirname, '..');
const domainDir = path.join(root, 'src', 'domain', name);

if (fs.existsSync(domainDir)) {
  console.error(`Domain "${name}" already exists at src/domain/${name}`);
  process.exit(1);
}

fs.mkdirSync(domainDir, { recursive: true });

const entityContent = `/**
 * ${entityName} entity – pure domain model.
 * Add properties and behavior; no Firebase/Infrastructure imports.
 */

export class ${entityName} {
  readonly id: string;

  constructor(data: { id: string }) {
    this.id = data.id;
  }

  toPlain(): { id: string } {
    return { id: this.id };
  }
}
`;

const indexContent = `export { ${entityName} } from './${entityName}';
`;

fs.writeFileSync(path.join(domainDir, `${entityName}.ts`), entityContent);
fs.writeFileSync(path.join(domainDir, 'index.ts'), indexContent);

console.log(`Created src/domain/${name}/`);
console.log(`  - ${entityName}.ts`);
console.log(`  - index.ts`);
console.log('Next: add to src/domain/index.ts: export * from "./' + name + '";');
process.exit(0);
