---
title: このサイトについて
description: "projectsprint.org の奥付。サイトの作り、使っている道具とそのライセンス、AI の利用、クレジット、サイトの歴史を記しています。"
---
# このサイトについて

このページは、いわゆる奥付（コロフォン）です。projectsprint.org は、Project Sprint をオープンソースのフレームワークとして公開するためのサイトです。このページでは、サイトの作り、使っている道具とそのライセンス、作り手について記します。

## ライセンス

### 文書（Project Sprint の内容）

Project Sprint の文書群（CODE、Practical Guide、過去バージョン、翻訳を含む）は、[クリエイティブ・コモンズ 表示 - 継承 4.0 国際（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/deed.ja) のもとで提供されています。出典を表示し、同じライセンスで公開する限り、商用利用を含めて自由に共有・翻案できます。リーガルコードの全文は [ライセンス](./license) のページにあります。

再利用するときの表示例：

> Project Sprint（https://www.projectsprint.org/）by Project Sprint Org, licensed under CC BY-SA 4.0

### サイトのコード

サイトを生成するプログラムと設定（リポジトリの `docs/.vitepress/` と `.github/` 配下、`package.json`）は、[MIT ライセンス](https://github.com/ProjectSprintOrg/projectsprint.org/blob/main/LICENSE-CODE.md)で提供しています。このサイトの作りをそのまま別のプロジェクトに流用しても構いません。文書とコードでライセンスが異なるのは、文書向けの CC BY-SA をプログラムに当てると再利用しづらいためです。

## クレジット

Project Sprint は、2020 年に[株式会社コパイロツト](https://copilot.jp/)（COPILOT Inc.）が起点となって公開され、2025 年に Project Sprint Org へ移管されました。コパイロツトは現在も、メンテナーの参加や週次ミーティングの運営を通じて Project Sprint の発展に協力しています。各ページのフッターの「Originated and supported by COPILOT Inc.」は、このことを示しています。

著作権表示の「Project Sprint Org and contributors」には、コパイロツトを含むこれまでのすべての貢献者が含まれます。

## 使っている道具

このサイトは、次のオープンソースソフトウェアとサービスの上に成り立っています。作者とコミュニティに感謝します。

| 道具 | 役割 | ライセンス |
| --- | --- | --- |
| [VitePress](https://vitepress.dev/) 1.6 | Markdown からサイトを生成する静的サイトジェネレーター | MIT |
| [Vue.js](https://vuejs.org/) 3 | ページの部品（アーカイブ版の表示、翻訳の注記、フッターなど） | MIT |
| [Vite](https://vite.dev/) 5 | ビルドツール | MIT |
| [markdown-it](https://github.com/markdown-it/markdown-it) / [markdown-it-footnote](https://github.com/markdown-it/markdown-it-footnote) | Markdown の解釈と脚注 | MIT |
| [MiniSearch](https://lucaong.github.io/minisearch/) | サイト内検索 | MIT |
| [Shiki](https://shiki.style/) | コードの表示 | MIT |
| [vitepress-plugin-llms](https://github.com/okineadev/vitepress-plugin-llms) | AI 向けの `llms.txt` の生成 | MIT |
| [Inter](https://rsms.me/inter/) | 欧文書体（VitePress 同梱） | SIL Open Font License 1.1 |
| [Simple Icons](https://simpleicons.org/) | GitHub のアイコン | CC0 1.0 |
| [GitHub Pages](https://pages.github.com/) / [GitHub Actions](https://github.com/features/actions) | 公開と自動ビルド | GitHub の利用規約による |
| [Google Gemini](https://gemini.google.com/) | Workshop（体験型 Project Sprint）の提供 | Google の利用規約による |
| [Miro](https://miro.com/) | Practical Guide のビジュアル版 | Miro の利用規約による |

サイトの本文は、閲覧者の端末にある日本語書体で表示されます。外部からの読み込みは行っていません。

## 作り方

- サイトのソースは GitHub のリポジトリ [ProjectSprintOrg/projectsprint.org](https://github.com/ProjectSprintOrg/projectsprint.org) にあります。`main` ブランチにマージされた変更は、自動的にこのサイトに反映されます。
- 各ページの下にある「GitHub でこのページを編集」から、どなたでも修正を提案できます。
- サイトの設計と構築、旧サイトからの移行、英語版の下訳は、Anthropic の AI アシスタント [Claude](https://claude.ai/) の支援を受けて行いました。方針の決定と内容の責任は Project Sprint Org にあります。英語版については、各ページの冒頭に AI 翻訳である旨を表示しています。

## これまでのサイト

- 2020 年〜2021 年：[Jekyll](https://jekyllrb.com/) と Minima テーマで構築。
- 2021 年〜2024 年：[GitBook](https://www.gitbook.com/) で公開。
- 2026 年〜：現在のサイト。旧サイトの URL は、対応する新しいページへ自動で転送されます。

## 連絡先

内容への質問や提案、サイトの不具合は、GitHub の [Issues](https://github.com/ProjectSprintOrg/projectsprint.org/issues) へお寄せください。
