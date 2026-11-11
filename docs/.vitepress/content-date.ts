import { execSync } from 'node:child_process'

// 「内容の最終更新」に使う日付の計算。
//
// 規則：md ファイルの本文（frontmatter 以外）が最後に変わったコミットの日時を使う。
// - ファイルの移動・改名は追跡する（--follow）
// - frontmatter（title / description など）だけを変えたコミットは本文の更新とみなさない
// - 空行だけの変更も本文の更新とみなさない
// この規則は scripts/check-site.mjs のテストで守られている。変えるときはテストも直すこと。

const FRONTMATTER_LINE = /^[+-](\s*$|---\s*$|\s*[A-Za-z_-]+:(\s|$)|\s*- [A-Za-z_-]+:\s)/

/**
 * @param repoRoot git リポジトリのルート
 * @param file リポジトリルートからの相対パス（例: docs/code/step0.md）
 * @returns 本文が最後に変わったコミットの時刻（ミリ秒）。履歴が無ければ undefined
 */
export function contentUpdatedAt(repoRoot: string, file: string): number | undefined {
  try {
    const out = execSync(`git log --follow --diff-filter=AM --format=%x01%at -p -- "${file}"`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024
    }).toString()
    for (const chunk of out.split('\x01').slice(1)) {
      const nl = chunk.indexOf('\n')
      const at = Number(chunk.slice(0, nl).trim())
      const changed = chunk.slice(nl + 1).split('\n').some(
        l => /^[+-]/.test(l) && !/^(\+\+\+|---) /.test(l) && !FRONTMATTER_LINE.test(l)
      )
      if (changed && at) return at * 1000
    }
    return undefined
  } catch {
    return undefined
  }
}
