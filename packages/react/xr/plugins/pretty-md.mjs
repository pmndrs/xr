import fs from 'fs'
import { dirname, join, resolve } from 'path'
import { Converter } from 'typedoc'
import { MarkdownPageEvent, MarkdownRendererEvent } from 'typedoc-plugin-markdown'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const kindsToExclude = [
  1, //"Project"
  2, //"Module"
  4, //"Namespace"
  8388608, //"Document"
]

export const load = (app) => {
  app.converter.on(Converter.EVENT_RESOLVE_END, (whatami) => {
    // Happens before the MarkdownPageEvents
  })

  app.renderer.markdownHooks.on('page.begin', (page) => {
    let deprecatedTag = undefined
    if (page.page?.model?.comment) {
      deprecatedTag = page.page.model.comment.blockTags.find((t) => t.tag === '@deprecated')
    } else if (page.page?.model?.signatures) {
      deprecatedTag = page.page.model.signatures[0].comment?.blockTags.find((t) => t.tag === '@deprecated')
    }
    if (deprecatedTag) {
      return `> [!CAUTION]\n> Deprecated: ${deprecatedTag.content.reduce((p, x) => p + x.text, '')}\n\n`
    }
    return
  })

  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    if (kindsToExclude.includes(page.model.kind)) {
      page.project.removeReflection(page.model) // remove from project
      return // Skip unwanted kinds
    }

    page.frontmatter = {
      title: page.model.name,
      nav: 0, // placeholder, will be set later
      sourcecode: page?.model?.sources?.[0]?.fileName ?? '',
    }
  })

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (kindsToExclude.includes(page.model.kind)) {
      page.contents = ''
      return
    }

    page.contents = page.contents.replace(/Defined in:.*\n\n/g, '')
    page.contents = page.contents.replace(/## Deprecated\n\n?.*\n?/g, '')

    // page.contents = prettify(page)
  })

  app.renderer.on(MarkdownRendererEvent.END, (page) => {
    const docsPath = resolve(__dirname, '../docs')
    const modulesPath = join(docsPath, 'modules')
    const readmePath = join(docsPath, 'README.md')
    const functionsPath = join(docsPath, 'functions')
    const variablesPath = join(docsPath, 'variables')
    const apiPath = resolve(__dirname, '../../../../docs/API')

    if (fs.existsSync(apiPath)) {
      fs.rmSync(apiPath, { recursive: true, force: true })
    }

    if (fs.existsSync(modulesPath)) {
      fs.rmSync(modulesPath, { recursive: true, force: true })
    }

    if (fs.existsSync(readmePath)) {
      fs.unlinkSync(readmePath)
    }

    if (!fs.existsSync(apiPath)) {
      fs.mkdirSync(apiPath, { recursive: true })
    }

    const moveFiles = (sourceDir) => {
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir)
        files.forEach((file) => {
          const sourceFile = join(sourceDir, file)
          const targetFile = join(apiPath, file)
          fs.renameSync(sourceFile, targetFile)
        })
      }
    }

    moveFiles(functionsPath)
    moveFiles(variablesPath)

    const sortFilesAndUpdateNav = (sourceDir) => {
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir)
        const functionQualifiedFiles = files.map((file) => {
          return {
            symbolName: file.slice(file.indexOf('.') + 1, file.lastIndexOf('.')),
            fileName: file,
          }
        })
        functionQualifiedFiles.sort((a, b) => a.symbolName.localeCompare(b.symbolName))
        functionQualifiedFiles.forEach((file, index) => {
          const targetFile = join(sourceDir, file.fileName)

          // Update the nav number in the frontmatter
          const content = fs.readFileSync(targetFile, 'utf-8')
          const updatedContent = content.replace(/nav:\s*\d+/, `nav: ${index + 1}`)
          fs.writeFileSync(targetFile, updatedContent)
        })
      }
    }

    sortFilesAndUpdateNav(apiPath)
  })
}

// ————————————————————————————————————————————————————————————————
// helper: build the Markdown body exactly how you asked for
const prettify = (page) => {
  const refl = page.model // DeclarationReflection
  if (!refl.signatures?.length) return page.contents // keep default for enums, etc.

  const sig = refl.signatures[0]
  const frontMatter = page.frontmatter
  const frontMatterLines = Object.entries(frontMatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
  const md = ['---\n' + frontMatterLines + '\n---\n']

  // description
  md.push(renderComment(sig.comment))

  // parameters
  if (sig.parameters?.length) {
    md.push('## Parameters')
    sig.parameters.forEach((p) => {
      md.push(`### ${p.name}`)
      md.push('`' + p.type?.toString() + '`')
      md.push(renderComment(p.comment))
    })
  }

  // returns
  if (sig.comment?.returns?.length) {
    md.push('## Returns')
    md.push('`' + sig.type?.toString() + '`')
    md.push(renderBlocks(sig.comment.returns))
  }

  // examples (all @example tags)
  const examples = sig.comment?.blockTags?.filter((t) => t.tag === '@example') || []
  if (examples.length) {
    md.push('## Examples')
    examples.forEach((ex) => {
      md.push('```ts\n' + renderBlocks(ex.content) + '\n```')
    })
  }

  return md.join('\n\n') // blank lines between sections
}

// ——— helpers for comment parts ——————————————————————————————
const renderComment = (c) => c?.summary?.map((p) => p.text).join('') ?? ''
const renderBlocks = (b) => b?.map((p) => p.text).join('') ?? ''
