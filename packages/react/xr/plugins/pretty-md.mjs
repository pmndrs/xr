import { MarkdownPageEvent } from 'typedoc-plugin-markdown'

export const load = (app) => {
  const pages = [] // collect pages so we can sort later

  // 1️⃣ collect & rewrite on the fly
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    const refl = page.model
    pages.push(page)

    // ---------- front-matter ----------
    page.frontmatter = {
      ...page.frontmatter,
      title: refl.name,
      sourcecode: refl?.sources?.[0]?.fileName ?? '',
    }

    // ---------- body ----------
    page.contents = prettify(page)
  })

  // 2️⃣ assign nav numbers alphabetically once the renderer is done
  app.renderer.on('renderer.end', () => {
    pages.sort((a, b) => a.model.name.localeCompare(b.model.name)).forEach((p, i) => (p.frontmatter.nav = i + 1))
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

  return md.join('\n\n') // blank lines between sections
}

// ——— helpers for comment parts ——————————————————————————————
const renderComment = (c) => c?.summary?.map((p) => p.text).join('') ?? ''
const renderBlocks = (b) => b?.map((p) => p.text).join('') ?? ''
