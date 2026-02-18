#!/usr/bin/env node
/**
 * Workaround: object-inspect erwartet ./util.inspect.js, liefert es aber nicht mit.
 * Nach npm install fehlt die Datei; dieses Script legt sie bei Bedarf an.
 */
const path = require('path');
const fs = require('fs');

const target = path.join(__dirname, '..', 'node_modules', 'object-inspect', 'util.inspect.js');
try {
  fs.accessSync(target);
} catch {
  fs.writeFileSync(target, "// Node: Re-export built-in util (workaround for missing file in object-inspect)\nmodule.exports = require('util');\n", 'utf8');
  console.log('functions: created object-inspect/util.inspect.js workaround');
}
