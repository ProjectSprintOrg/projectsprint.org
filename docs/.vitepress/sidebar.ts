import fs from 'node:fs'
import path from 'node:path'
import type { DefaultTheme } from 'vitepress'

const DOCS = path.resolve(__dirname, '..')

/** Markdown ファイルの最初の H1 をタイトルとして返す */
export function titleOf(file: string): string {
  const src = fs.readFileSync(file, 'utf8')
  const m = src.match(/^#\s+(.+?)\s*$/m)
  return m ? m[1].replace(/\*\*/g, '').trim() : path.basename(file, '.md')
}

/** docs 配下の .md のパスを URL に変換する */
function toLink(file: string): string {
  const rel = path.relative(DOCS, file).replace(/\\/g, '/')
  return '/' + rel.replace(/index\.md$/, '').replace(/\.md$/, '')
}

/**
 * index ページ内のリンクの並び順で、その版のページ一覧を組み立てる。
 * 「index に書かれた順番がそのままサイドバー」になるので、設定ファイルを触らずに版ごとの構成を保てる。
 */
export function fromIndex(indexFile: string, opts: { recurse?: boolean } = {}): DefaultTheme.SidebarItem[] {
  const abs = path.resolve(DOCS, indexFile)
  const dir = path.dirname(abs)
  const src = fs.readFileSync(abs, 'utf8')
  const seen = new Set<string>()
  const items: DefaultTheme.SidebarItem[] = []
  for (const m of src.matchAll(/\]\(([^)#\s]+?\.md|[^)#\s]+?\/)\)/g)) {
    let target = m[1]
    if (/^https?:/.test(target)) continue
    if (target.endsWith('/')) target += 'index.md'
    const file = path.resolve(dir, target)
    if (!fs.existsSync(file) || seen.has(file) || file === abs) continue
    seen.add(file)
    const item: DefaultTheme.SidebarItem = { text: titleOf(file), link: toLink(file) }
    if (opts.recurse && path.basename(file) === 'index.md') {
      const children = fromIndex(path.relative(DOCS, file), opts)
      if (children.length) {
        item.items = children
        item.collapsed = true
      }
    }
    items.push(item)
  }
  return items
}
