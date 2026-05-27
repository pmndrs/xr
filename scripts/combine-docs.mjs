#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const docsDir = path.join(repoRoot, 'docs')
const outputFile = path.join(repoRoot, 'llms.txt')
const skillReferencesDir = path.join(repoRoot, 'skills', 'pmndrs-xr', 'references')

const extraReferenceSources = [
  { file: path.join(repoRoot, 'packages', 'xr', 'README.md'), title: '@pmndrs/xr' },
  {
    file: path.join(repoRoot, 'packages', 'pointer-events', 'README.md'),
    title: '@pmndrs/pointer-events',
  },
  {
    file: path.join(repoRoot, 'packages', 'handle', 'README.md'),
    title: '@pmndrs/handle',
  },
  {
    file: path.join(repoRoot, 'packages', 'react', 'handle', 'README.md'),
    title: '@react-three/handle',
  },
]

async function listFilesRecursively(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = path.join(dir, dirent.name)
      if (dirent.isDirectory()) return listFilesRecursively(fullPath)
      return fullPath
    }),
  )
  return files.flat()
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return { data: {}, body: content }
  const end = content.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: content }
  const header = content.slice(3, end).trim()
  const body = content.slice(end + 4).replace(/^\s*\n/, '')
  const data = {}
  for (const line of header.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let raw = line.slice(idx + 1).trim()
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      raw = raw.slice(1, -1)
    }
    if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
      data[key] = Number(raw)
    } else if (raw === 'true' || raw === 'false') {
      data[key] = raw === 'true'
    } else {
      data[key] = raw
    }
  }
  return { data, body }
}

function anchorIdFromRelPath(relPath) {
  const noExt = relPath.split(path.sep).join('/').replace(/\.(md|mdx)$/i, '')
  return (
    'doc-' +
    noExt
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
  )
}

function rewriteInternalLinksForCombined(md, fromFile) {
  return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, text, link) => {
    const trimmed = link.trim()
    if (/^(https?:|mailto:|tel:|#)/i.test(trimmed)) return full
    const hashIdx = trimmed.indexOf('#')
    const filePart = hashIdx === -1 ? trimmed : trimmed.slice(0, hashIdx)
    if (!/\.(md|mdx)$/i.test(filePart)) return full
    const abs = path.resolve(path.dirname(fromFile), filePart)
    const rel = path.relative(docsDir, abs)
    if (rel.startsWith('..')) return full
    return `[${text}](#${anchorIdFromRelPath(rel)})`
  })
}

function normalizeForReference(md) {
  return md
    .replace(/<!--[\s\S]*?-->\n*/g, '')
    .replace(/<span style=\{\{fontSize: 24, color: "rgb\(var\(--color-primary\)\)"\}\}>\*\*([^*]+)\*\*<\/span>/g, '### `$1`')
    .replace(/<p align="center">[\s\S]*?<\/p>\n*/g, '')
    .replace(/<h1 align="center">([^<]+)<\/h1>/g, '# $1')
    .replace(/<h3 align="center">([^<]+)<\/h3>/g, '$1')
}

function isDeprecatedEntry(entry) {
  return (
    entry.rel.includes('/deprecated_') ||
    String(entry.frontmatter.sourcecode ?? '').includes('/deprecated/') ||
    /^> \[!CAUTION\]\n> Deprecated:/m.test(entry.body)
  )
}

function compareByNavThenTitle(a, b) {
  const aNav = a.frontmatter.nav ?? Number.POSITIVE_INFINITY
  const bNav = b.frontmatter.nav ?? Number.POSITIVE_INFINITY
  if (aNav !== bNav) return aNav - bNav
  return String(a.title).toLowerCase().localeCompare(String(b.title).toLowerCase())
}

function skillReferenceRelPathForEntry(entry) {
  return entry.rel.replace(/\.(md|mdx)$/i, '.md')
}

function renderEntry(entry, { combined }) {
  const parts = [`# ${entry.title}`]
  parts.push('')
  parts.push((combined ? rewriteInternalLinksForCombined(entry.body, entry.file) : entry.body).trim())
  return parts.join('\n') + '\n'
}

function renderEntries(entries) {
  return entries.map((entry) => renderEntry(entry, { combined: true })).join('\n')
}

function renderReferenceIndex(entries) {
  const parts = [
    '# Reference Index',
    '',
    'Read the smallest file that matches the task.',
    '',
  ]
  let currentTopLevel = ''
  const sortedEntries = [...entries].sort((a, b) =>
    skillReferenceRelPathForEntry(a).localeCompare(skillReferenceRelPathForEntry(b)),
  )
  for (const entry of sortedEntries) {
    const referenceRel = skillReferenceRelPathForEntry(entry)
    const [topLevel, section = ''] = referenceRel.split('/')
    const group = section ? `${topLevel}/${section}` : topLevel
    if (group !== currentTopLevel) {
      currentTopLevel = group
      parts.push('')
      parts.push(`## ${group}`)
      parts.push('')
    }
    parts.push(`- [${entry.title}](${referenceRel})`)
  }
  return parts.join('\n') + '\n'
}

async function readEntry(file, { title: forcedTitle } = {}) {
  const content = await fs.readFile(file, 'utf8')
  const { data, body } = parseFrontmatter(content)
  const rel = path.relative(repoRoot, file).split(path.sep).join('/')
  const title = forcedTitle ?? data.title ?? path.basename(file)
  return {
    file,
    rel,
    title,
    frontmatter: data,
    anchorId: rel.startsWith('docs/')
      ? anchorIdFromRelPath(path.relative(docsDir, file))
      : anchorIdFromRelPath(rel),
    body: normalizeForReference(body),
  }
}

async function main() {
  const allDocs = await listFilesRecursively(docsDir)
  const docEntries = await Promise.all(
    allDocs.filter((file) => /\.(md|mdx)$/i.test(file)).map((file) => readEntry(file)),
  )
  const extraEntries = []
  for (const source of extraReferenceSources) {
    try {
      extraEntries.push(await readEntry(source.file, source))
    } catch {
      // Optional package README source.
    }
  }

  const entries = [...docEntries, ...extraEntries]
    .filter((entry) => !isDeprecatedEntry(entry))
    .sort(compareByNavThenTitle)
  const curatedSkillReferences = await readCuratedSkillReferences()
  await fs.writeFile(outputFile, renderEntries(entries), 'utf8')

  await fs.rm(skillReferencesDir, { recursive: true, force: true })
  await fs.mkdir(skillReferencesDir, { recursive: true })
  await fs.writeFile(path.join(skillReferencesDir, 'index.md'), renderReferenceIndex(entries), 'utf8')
  for (const entry of entries) {
    const referenceRel = skillReferenceRelPathForEntry(entry)
    const referencePath = path.join(skillReferencesDir, referenceRel)
    await fs.mkdir(path.dirname(referencePath), { recursive: true })
    await fs.writeFile(referencePath, renderEntry(entry, { combined: false }), 'utf8')
  }
  for (const reference of curatedSkillReferences) {
    const referencePath = path.join(skillReferencesDir, reference.rel)
    await fs.mkdir(path.dirname(referencePath), { recursive: true })
    await fs.writeFile(referencePath, reference.content, 'utf8')
  }

  console.log(`Wrote combined docs to ${path.relative(repoRoot, outputFile)} (${entries.length} files)`)
  console.log(`Wrote ${entries.length} structured skill reference files to ${path.relative(repoRoot, skillReferencesDir)}`)
}

async function readCuratedSkillReferences() {
  let files
  try {
    files = await listFilesRecursively(skillReferencesDir)
  } catch {
    return []
  }

  const generatedRoots = new Set(['docs', 'packages'])
  const preserved = []
  for (const file of files) {
    if (!/\.md$/i.test(file)) continue
    const rel = path.relative(skillReferencesDir, file).split(path.sep).join('/')
    const [topLevel] = rel.split('/')
    if (rel === 'index.md' || generatedRoots.has(topLevel)) continue
    preserved.push({ rel, content: await fs.readFile(file, 'utf8') })
  }
  return preserved
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
