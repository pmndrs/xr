import { MarkdownPageEvent, MarkdownRendererEvent } from 'typedoc-plugin-markdown'

function toYaml(obj) {
  return (
    '---\n' +
    Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') +
    '\n---\n\n'
  )
}

const kindsToExclude = [
  1, //"Project"
  2, //"Module"
  4, //"Namespace"
  8388608, //"Document"
]

export const load = (app) => {
  const pages = [] // collect pages so we can sort later

  console.log('pages', pages)
  // 1️⃣ collect & rewrite on the fly
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    if (kindsToExclude.includes(page.model.kind)) {
      page.contents = '' // remove unwanted pages
      return // Skip unwanted kinds
    }

    pages.push(page)

    // ---------- front-matter ----------
    page.frontmatter = {
      title: page.model.name,
      nav: 0, // placeholder, will be set later
      sourcecode: page?.model?.sources?.[0]?.fileName ?? '',
    }

    // ---------- body ----------
    page.contents = prettify(page)
  })

  // 2️⃣ assign nav numbers alphabetically once the renderer is done
  app.renderer.on(MarkdownRendererEvent.END, () => {
    // alphabetical order → nav#
    pages
      .sort((a, b) => a.model.name.localeCompare(b.model.name))
      .forEach((page, i) => {
        page.frontmatter.nav = i + 1
        console.log('index', i)

        // strip any YAML that’s already there, then prepend the fresh block
        page.contents = page.contents.replace(/nav: 0/, `nav: ${i + 1}`)
      })
  })
}

// ————————————————————————————————————————————————————————————————
// helper: build the Markdown body exactly how you asked for
const prettify = (page) => {
  const refl = page.model // DeclarationReflection
  if (!refl.signatures?.length) return page.contents // keep default for enums, etc.

  const sig = refl.signatures[0]
  const md = []

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
  md.push('balllloooogaaaa')

  return md.join('\n\n') // blank lines between sections
}

// ——— helpers for comment parts ——————————————————————————————
const renderComment = (c) => c?.summary?.map((p) => p.text).join('') ?? ''
const renderBlocks = (b) => b?.map((p) => p.text).join('') ?? ''
