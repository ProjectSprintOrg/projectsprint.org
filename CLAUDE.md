# projectsprint.org の運用ルール（AI セッション向け）

このファイルは、このリポジトリで作業する Claude Code（どのモデルでも）が最初に読む運用ルールです。
人向けの説明は README.md と CONTRIBUTING.md にあります。ここには「作業のたびに守ること」と「判断の基準」だけを書きます。

ここに書いた規則の多くは `npm run docs:check` で機械的に確認されます（`scripts/check-site.mjs`）。
規則を足したり変えたりしたときは、このファイルとチェックスクリプトの両方を直してください。

## このリポジトリは何か

- Project Sprint（不確実な状況でプロジェクトを前進させるオープンソースのフレームワーク）の公式サイト https://www.projectsprint.org/ のソース。
- `docs/` 配下の Markdown を VitePress でビルドし、`main` への push で GitHub Actions が GitHub Pages に公開する（`.github/workflows/deploy.yml`）。
- 日本語が正本。英語（`docs/en/`）は AI 下訳＋コミュニティ校閲の段階。

## 作業の流れ（毎回）

1. `main` から切った作業ブランチで作業する。指定されたブランチ以外に push しない。force push はしない。
2. 変更したら、push する前に必ず次を実行し、すべて通ることを確認する。

   ```bash
   npm run docs:check
   ```

   本番と同じ `base=/` でビルドし、下の「守ること」を確認する。CI（PR）でも同じものが走る。`.claude/settings.json` のフックにより、`git push` の前にも自動で走る。
3. PR の base は `main`。PR 本文は `.github/pull_request_template.md` の見出しに沿って書く。マージは人（メンテナー）が行う。
4. 本番に反映されたら、実際のページを 1 つ以上開いて確認する（見た目・「内容の最終更新」・リンク）。
5. 報告は日本語で。「あなた（人）がやること」と「Claude がやったこと」を分けて書く。

## 守ること（変えるときは相談する決定事項）

### 情報設計・ナビゲーション

- ヘッダー（日本語）は `Workshop / CODE v5.0 / Practical Guide / Community / Versions` の 5 つ。`Versions` の中に CODE の各版（v5.0（最新）/ v4.3 / v3.3 / v2.2）と、区切りの下に `Release Notes` と `過去バージョンについて` を置く。`Releases` を単独で出さない。英語ヘッダーも同じ構成（`CODE v5.0 / Community (Japanese) / Versions`）。
- ヘッダーの CODE には版番号を付け、過去版を見ているときも最新版を指す。
- メニュー項目の文言はページの H1 に揃える。
- 左サイドバー＝今見ている版の構成、右＝今のページの見出し。前後ページのナビは使わない（`prev: false / next: false`）。ページ末尾の `VersionFooter` がその版の構成全体と各版のトップへのリンクを出す。
- 英語版は日本語のバージョン一覧に混ぜず、言語切り替え側に置く。
- 表示はライト固定（`appearance: false`）。ダークモードを足さない。
- フッターは日英とも英語 3 行：`© 2020–2026 Project Sprint Org and contributors.` / 文書 CC BY-SA 4.0・サイトコード MIT・About this site / `Originated and supported by COPILOT Inc.`。

### 文書の扱い

- `docs/code/` が最新版 CODE（v5.0）。新しい版は同じディレクトリを更新し、版ごとのディレクトリは作らない（手順は CONTRIBUTING.md「新しい版を出すときの手順」）。
- Practical Guide（`docs/practical-guide/`）は CODE v4 準拠。「CODE v4 準拠」の表示を外さない。「内容の最終更新」は v4.3 のリリース日で固定。
- 過去版（`docs/archive/`、`docs/en/archive/`）の本文は変更しない。表示上の調整（alt、リンク先など）はビルド側（`config.ts` の markdown ルール、リダイレクト）で行う。やむを得ず本文を直すときは PR で理由を説明する。
- Release Notes の正本は `docs/releases.md`。GitHub Releases にはタグと短い要約だけ。
- 図版は `docs/code/images/` に置く。GitHub の添付 URL を参照しない。
- Markdown に `<style>` / `<script>` を書かない。CSS は `docs/.vitepress/theme/custom.css` へ。画像には alt を付ける。`<BR>` は `<br>`（大文字は Vue がビルドで落ちる）。
- 旧 GitBook / Jekyll 時代の URL はビルド時に転送ページを生成している（`docs/.vitepress/redirects.ts`、`old-urls.txt`）。ページを移動・改名したら `mapOldPath` に旧パスを足す。

### 「内容の最終更新」

- 各ページの「内容の最終更新」は、**本文（frontmatter 以外）が最後に変わった git コミットの日時**。ファイルの移動・改名、frontmatter（title / description など）だけの変更、空行だけの変更では動かない。実装は `docs/.vitepress/content-date.ts`。
- 過去版と Practical Guide はその版のリリース日（`ARCHIVE_DATES`）。ライセンスページは非表示。
- 全ページに影響する変更（frontmatter を一斉に足す、ファイルを一斉に移す）をしたら、この日付が動いていないことを本番で確認する。PR #8 でこれを見落とし、PR #9 で直した。

### SEO・AI 向け

- 現行の全ページ（`archive/` 以外）に frontmatter の `description`（30 字以上）を書く。無いページは本文から自動生成されるが、主要ページは必ず手で書く。
- 全ページに canonical / og:* / twitter:card / JSON-LD を `config.ts` の `transformHead` で出す。og:image は絶対 URL。日英で対応するページには hreflang（x-default は日本語）。
- `llms.txt` の目次は「日本語（正本）→ 英語 → 過去版の入口」の順（`config.ts` の `LLMS_SIDEBAR`）。**新しいページを足したら `LLMS_SIDEBAR` とサイドバーの両方に加える**（載せ忘れると `### Other` 節が出てチェックが落ちる）。過去版の個別ページは目次と `llms-full.txt` に入れない。
- サイトマップは実ページのみ。優先度は入口 1.0・現行 0.7・過去版 0.3。404 と転送ページは noindex。

### 翻訳

- `docs/code/` と `docs/en/code/` は同じファイル構成にする。日本語にページを足したら英語にも足す（AI 下訳でよい。できないときは Issue に残す）。
- 英語ページには `TranslationNotice` が AI 翻訳である旨と校閲募集を出す。原文の方が新しければ自動で注意が出る。
- 訳語は `docs/en/code/keyterms.md` の対応表に揃える：出力 = output（行為）、作成物 = artifact、成果 = outcome、納得 = conviction (nattoku)、共通了解 = shared understanding、主体 = agent、会議体 = standing meeting、定例会議 = regular meeting、収穫祭 = harvest festival、振り返り = reflection。

## やらないこと

- `main` への直接 push、force push、指定外ブランチへの push。
- 過去版本文の書き換え、ダークモードの追加、前後ナビの復活、ヘッダーへの項目追加（相談なしに）。
- Release Notes を GitHub Releases 側に重ねて書くこと。
- コミットメッセージ・PR・コードコメントにモデル名を書くこと（ツールが付ける Co-Authored-By は除く）。
- 人の確認が要るもの（DNS、GitHub の設定、外部サービス）を勝手に進めること。手順を書いて渡す。

## 新しいページを足すときの確認表

1. `docs/<セクション>/<名前>.md` を作る。ファイル名は小文字・ハイフン区切り。H1 を 1 つ。frontmatter に `description`。
2. `docs/.vitepress/config.ts`：`SIDEBAR_JA`（または英語側）と `LLMS_SIDEBAR` に追加。
3. 英語版があるセクションなら `docs/en/...` にも同じファイルを足す。
4. `npm run docs:check` が通ること。

## 判断に迷ったら

- 決定事項の変更に当たるなら、実装する前に選択肢と推奨を短く示して人に聞く。
- 規則どおりに作業して副作用が出たら（ビルドが落ちる、日付が動く、リンクが切れる）、隠さずに報告し、直す PR を別に出す。
