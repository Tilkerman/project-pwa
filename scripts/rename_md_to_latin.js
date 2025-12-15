/**
 * Rename *.md files with Cyrillic characters in filename to Latin (translit + UPPER_SNAKE_CASE),
 * using `git mv` to preserve history. Also updates references in repo files.
 *
 * Usage:
 *   node scripts/rename_md_to_latin.js
 */

import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'

const repoRoot = process.cwd()

const CYRILLIC_RE = /[\u0400-\u04FF]/

// Russian transliteration (basic)
const TRANSLIT = new Map([
  ['\u0410', 'A'], ['\u0411', 'B'], ['\u0412', 'V'], ['\u0413', 'G'], ['\u0414', 'D'],
  ['\u0415', 'E'], ['\u0401', 'E'], ['\u0416', 'ZH'], ['\u0417', 'Z'], ['\u0418', 'I'],
  ['\u0419', 'Y'], ['\u041A', 'K'], ['\u041B', 'L'], ['\u041C', 'M'], ['\u041D', 'N'],
  ['\u041E', 'O'], ['\u041F', 'P'], ['\u0420', 'R'], ['\u0421', 'S'], ['\u0422', 'T'],
  ['\u0423', 'U'], ['\u0424', 'F'], ['\u0425', 'KH'], ['\u0426', 'TS'], ['\u0427', 'CH'],
  ['\u0428', 'SH'], ['\u0429', 'SCH'], ['\u042A', ''], ['\u042B', 'Y'], ['\u042C', ''],
  ['\u042D', 'E'], ['\u042E', 'YU'], ['\u042F', 'YA'],
  ['\u0430', 'a'], ['\u0431', 'b'], ['\u0432', 'v'], ['\u0433', 'g'], ['\u0434', 'd'],
  ['\u0435', 'e'], ['\u0451', 'e'], ['\u0436', 'zh'], ['\u0437', 'z'], ['\u0438', 'i'],
  ['\u0439', 'y'], ['\u043A', 'k'], ['\u043B', 'l'], ['\u043C', 'm'], ['\u043D', 'n'],
  ['\u043E', 'o'], ['\u043F', 'p'], ['\u0440', 'r'], ['\u0441', 's'], ['\u0442', 't'],
  ['\u0443', 'u'], ['\u0444', 'f'], ['\u0445', 'kh'], ['\u0446', 'ts'], ['\u0447', 'ch'],
  ['\u0448', 'sh'], ['\u0449', 'sch'], ['\u044A', ''], ['\u044B', 'y'], ['\u044C', ''],
  ['\u044D', 'e'], ['\u044E', 'yu'], ['\u044F', 'ya'],
])

function translit(input) {
  let out = ''
  for (const ch of input) out += TRANSLIT.get(ch) ?? ch
  return out
}

function toUpperSnake(input) {
  // Keep dots/dashes/underscores, convert whitespace to underscores, remove other punctuation to underscores.
  let s = input.replace(/\s+/g, '_')
  s = s.replace(/[^A-Za-z0-9._-]+/g, '_')
  s = s.replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return s.toUpperCase()
}

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (ent.isFile() && p.toLowerCase().endsWith('.md')) out.push(p)
  }
}

function runGit(args) {
  childProcess.execFileSync('git', args, { stdio: 'inherit' })
}

function isTrackedByGit(p) {
  try {
    childProcess.execFileSync('git', ['ls-files', '--error-unmatch', p], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function normalizeRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/')
}

function fileExists(p) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

function readTextFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

function writeTextFileSafe(p, content) {
  fs.writeFileSync(p, content, 'utf8')
}

function main() {
  const mdFiles = []
  walk(repoRoot, mdFiles)

  const renames = []
  for (const abs of mdFiles) {
    const base = path.basename(abs)
    if (!CYRILLIC_RE.test(base)) continue

    const dir = path.dirname(abs)
    const stem = base.slice(0, -'.md'.length)
    const newBase = `${toUpperSnake(translit(stem))}.md`
    const target = path.join(dir, newBase)

    if (target !== abs) renames.push([abs, target])
  }

  // Resolve collisions
  const used = new Set(mdFiles.map((f) => path.resolve(f)))
  for (let i = 0; i < renames.length; i++) {
    const [from, proposed] = renames[i]
    let to = proposed
    let n = 2
    while (used.has(path.resolve(to)) || (fileExists(to) && path.resolve(to) !== path.resolve(from))) {
      const dir = path.dirname(proposed)
      const ext = path.extname(proposed)
      const stem = path.basename(proposed, ext)
      to = path.join(dir, `${stem}_${n}${ext}`)
      n++
    }
    renames[i] = [from, to]
    used.add(path.resolve(to))
  }

  if (renames.length === 0) {
    console.log('No Cyrillic .md filenames found. Nothing to rename.')
    return
  }

  // Do renames via git mv
  console.log(`Renaming ${renames.length} .md files (Cyrillic -> Latin)...`)
  for (const [from, to] of renames) {
    if (isTrackedByGit(from)) {
      runGit(['mv', from, to])
    } else {
      // Untracked file: just rename on filesystem (history doesn't matter here).
      fs.renameSync(from, to)
    }
  }

  // Save mapping
  const mapping = renames.map(([from, to]) => [normalizeRel(from), normalizeRel(to)])
  writeTextFileSafe(path.join(repoRoot, 'md_rename_map.json'), JSON.stringify(mapping, null, 2))

  // Update references across repo (best-effort, text files only)
  const allFiles = []
  const textLike = (p) =>
    /\.(md|txt|yml|yaml|json|js|ts|vue|html|css)$/i.test(p) && !/\/node_modules\//.test(p) && !/\/dist\//.test(p)

  function walkAll(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'dist') continue
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) walkAll(p)
      else if (ent.isFile() && textLike(p)) allFiles.push(p)
    }
  }
  walkAll(repoRoot)

  let updatedCount = 0
  for (const file of allFiles) {
    const before = readTextFileSafe(file)
    if (before == null) continue
    let after = before
    for (const [oldRel, newRel] of mapping) {
      // Replace both full relative and basename occurrences (most docs reference just filename)
      const oldBase = oldRel.split('/').pop()
      const newBase = newRel.split('/').pop()
      after = after.split(oldRel).join(newRel)
      if (oldBase && newBase) after = after.split(oldBase).join(newBase)
    }
    if (after !== before) {
      writeTextFileSafe(file, after)
      updatedCount++
    }
  }

  console.log(`Updated references in ${updatedCount} files.`)
  console.log('Done.')
}

main()


