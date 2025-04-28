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
    console.log('Converter.EVENT_RESOLVE_END', whatami)
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
    page.contents = prettify(page)
  })

  app.renderer.on(MarkdownRendererEvent.END, (page) => {
    console.log(__dirname)

    const docsPath = resolve(__dirname, '../docs')
    const modulesPath = join(docsPath, 'modules')
    const readmePath = join(docsPath, 'README.md')
    const functionsPath = join(docsPath, 'functions')
    const variablesPath = join(docsPath, 'variables')
    const apiPath = resolve(__dirname, '../../../../docs/API')

    // Delete the modules directory
    if (fs.existsSync(modulesPath)) {
      fs.rmSync(modulesPath, { recursive: true, force: true })
      console.log(`Deleted directory: ${modulesPath}`)
    }

    // Delete the README.md file
    if (fs.existsSync(readmePath)) {
      fs.unlinkSync(readmePath)
      console.log(`Deleted file: ${readmePath}`)
    }

    // Ensure the target API directory exists
    if (!fs.existsSync(apiPath)) {
      fs.mkdirSync(apiPath, { recursive: true })
      console.log(`Created directory: ${apiPath}`)
    }

    // Move files from functions and variables to the API directory
    const moveFiles = (sourceDir) => {
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir)
        files.forEach((file) => {
          const sourceFile = join(sourceDir, file)
          const targetFile = join(apiPath, file)
          fs.renameSync(sourceFile, targetFile)
          console.log(`Moved file: ${sourceFile} -> ${targetFile}`)
        })
      }
    }

    moveFiles(functionsPath)
    moveFiles(variablesPath)
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
