#!/usr/bin/env node
// Claude Code の PreToolUse フック（.claude/settings.json から呼ばれる）。
// Bash ツールで `git push` を実行しようとしたときに、先に `npm run docs:check` を走らせる。
// 通らなければ push を止め、理由を Claude に返す。どのモデルで作業していても同じ確認が入る。

import { execSync } from 'node:child_process'

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => (input += c))
process.stdin.on('end', () => {
  let cmd = ''
  try { cmd = JSON.parse(input)?.tool_input?.command ?? '' } catch { /* 入力が JSON でなければ何もしない */ }
  if (!/\bgit\s+push\b/.test(cmd)) process.exit(0)

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  try {
    execSync('npm run -s docs:check', { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 170_000 })
    process.exit(0)
  } catch (e) {
    const out = `${e.stdout ?? ''}\n${e.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n')
    console.error(`push を止めました。npm run docs:check が通っていません。直してから push してください。\n\n${out}`)
    process.exit(2)
  }
})
