#!/usr/bin/env node
/*
  Simple static scan for common pitfalls detected in CI:
  - react-query v5: keepPreviousData option
  - zod date required_error pattern
  - Firestore PaginatedResponse iteration without .data
  - Using _userId vs userId mismatch in query filters
  - Day fields expecting string but provided number (getTime())
*/

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'functions') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name))) scanFile(full);
  }
}

function report(file, line, message) {
  findings.push({ file, line, message });
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (/keepPreviousData\s*:/.test(line)) report(file, idx + 1, 'react-query v5: keepPreviousData not supported; use placeholderData: (prev)=>prev');
    if (/z\.date\s*\(\s*\{\s*required_error\s*:/.test(line)) report(file, idx + 1, 'zod: avoid z.date({ required_error }); use z.coerce.date().refine with message');
    if (/\.forEach\(\s*\w+\s*=>/.test(line) && /assignments\b(?!\.data)/.test(line) && /assignments/.test(content) && /PaginatedResponse/.test(content)) report(file, idx + 1, 'PaginatedResponse: iterate assignments.data, not the response object');
    if (/where\(\s*['"]userId['"]\s*,\s*['"]/.test(line) && /_userId/.test(content) && /userId\)/.test(line)) report(file, idx + 1, 'userId/_userId mismatch in query filter');
    if (/\.getTime\(\)\s*[,)]/.test(line) && /hoursByDay|surchargeByDay/.test(content)) report(file, idx + 1, 'Day field likely expects string (YYYY-MM-DD), not number (getTime)');
  });
}

walk(root);

if (findings.length) {
  console.log('Static scan warnings:');
  for (const f of findings) console.log(`- ${f.file}:${f.line} - ${f.message}`);
  // Do not fail the build; this is advisory
  process.exitCode = 0;
} else {
  console.log('Static scan: no issues found.');
}
