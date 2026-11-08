# 質問・提案・貢献の方法

このページでは、以下のようなときにどうしたらいいかを紹介します。

- Project Sprint に関する疑問点・不明点について質問したいとき
- Project Sprint に改善や修正の提案をしたいとき
- Project Sprint を一緒につくってみたいと思われたとき

Project Sprint は、[CC BY-SA 4.0 ライセンス](https://github.com/ProjectSprintOrg/projectsprint.org/blob/main/LICENSE.md)で提供されるオープンなフレームワークで、有志のメンバーたちによる定義と改善を繰り返してかたちづくられています。

## 質問や提案はこちらへ

疑問点や不明点についてのご質問、改善や修正のご提案、その他フィードバックは、[Issues](https://github.com/ProjectSprintOrg/projectsprint.org/issues) または [Pull requests](https://github.com/ProjectSprintOrg/projectsprint.org/pulls) にお寄せください。おおよそ以下のような内容・観点での投稿を想定していますが、もちろん他の観点からのご意見も歓迎です。

| 投稿場所 | 内容 | 観点 |
| --- | --- | --- |
| **Issues** | 実践知の還元<br>実践にあたっての不明点<br>記述の拡充依頼 | Project Sprint を実践してみて良かった点・うまくいかなかった点<br>導入や活用に関する疑問・質問<br>理解しにくかった箇所や実践における悩みなど追記や充実を期待する点<br>Project Sprint が取り込むべき新たな理論やまだ記述されていない論点 |
| **Pull Requests** | 具体的な改善や修正の提案 | 記述の変更や追記が必要と考える点<br>記述することによって Project Sprint をよりよくできると考える点<br>誤字脱字やリンク切れ等 |

## Issue の出し方

[New issue](https://github.com/ProjectSprintOrg/projectsprint.org/issues/new/choose) からご投稿いただければ、内容に応じてメンバーがサポートしたりフィードバックをお返ししたりします。投稿の際は、内容に合ったテンプレート（質問／提案・修正／リンク切れ・表示の不具合／翻訳の指摘）を選んでください。

## Pull Request の出し方

このリポジトリの `docs/` 配下の Markdown がサイト（projectsprint.org）のソースです。マージされた変更は自動的にサイトに反映されます。

1. `main` からあなたの作業用ブランチを作成してください。ブランチ名に特にルールはありませんが、`dev-` の後ろにご提案の内容を簡潔に示す英単語等を付す形（例: `dev-creativity`）にしていただけると判別しやすくなります。
2. `docs/` 配下の該当する Markdown を編集してください。サイトの各ページ下部にある「GitHub でこのページを編集」からも直接編集できます。
3. 作業が終わったら、`main` を base にして Pull Request を作成してください。Pull Request ではサイトのビルドとリンク切れチェックが自動で実行されます。
4. メンバーが内容を確認し、必要に応じてさらなるコミュニケーションやブラッシュアップを経たうえで、`main` にマージします。

### 編集するファイルの場所

| 内容 | 場所 |
| --- | --- |
| CODE（最新版） | `docs/code/` |
| Practical Guide | `docs/practical-guide/` |
| Community・貢献ガイド | `docs/community/`、`CONTRIBUTING.md` |
| Release Notes | `docs/releases.md` |
| 過去バージョン（参照用。原則変更しない） | `docs/archive/`、`docs/en/archive/` |
| 英語版 | `docs/en/` |

## Release Notes について

Release Notes の正本は [`docs/releases.md`](https://www.projectsprint.org/releases) です。各版の変更内容はここに書きます。

GitHub の [Releases](https://github.com/ProjectSprintOrg/projectsprint.org/releases) には、タグと 2〜3 行の要約、`https://www.projectsprint.org/releases` へのリンクだけを書きます。変更内容の詳細を GitHub Releases 側に重ねて書くことはしません（二か所に書くと食い違いが生まれるため）。

## 新しい版を出すときの手順

1. `docs/code/` の文書を直接更新します。`v5_1` のような版ごとの新しいディレクトリは作りません。過去の版は git のタグで残します。
2. `docs/releases.md` の先頭（「CODE」の節の最初）に、新しい版の節を追加します。
3. `main` にマージしたら、そのマージコミットに版のタグ（例: `v5.1`）を打ちます。
4. GitHub の [Releases](https://github.com/ProjectSprintOrg/projectsprint.org/releases) で、そのタグから Release を作り、2〜3 行の要約と `https://www.projectsprint.org/releases` へのリンクを書きます。
5. メジャーバージョンが上がったとき（例: v5 → v6）だけ、前のメジャーの最終版（例: v5.3）を `docs/archive/vX.Y/` に複製し、次の箇所に追加します。
   - サイドバーとナビゲーションの「バージョン」メニュー（`docs/.vitepress/config.ts`）
   - ページ下部のバージョン一覧（`docs/.vitepress/theme/VersionFooter.vue`）
   - 過去バージョンの一覧（`docs/archive/index.md`）

## 翻訳について

日本語版（`docs/code/`）が正本です。翻訳は同じリポジトリの `docs/<言語コード>/` 配下に、日本語版と同じファイル構成で置きます。

- 英語版は `docs/en/code/` にあります。AI による下訳を公開し、コミュニティの校閲を募集している段階です。各ページの冒頭にその旨を表示しています。英語で Project Sprint を実践した方、英語を母語とする方の校閲を特に歓迎します。
- 日本語の原文が更新されると、対応する翻訳ページに「原文の方が新しい」という注意が自動で表示されます。原文の変更に合わせて翻訳を更新する PR を歓迎します。
- 訳語は [Key Terms（英語版）](https://www.projectsprint.org/en/code/keyterms) の対応表に揃えてください。新しい訳語を提案したいときは Issue で相談してください。
- 新しい言語を追加したいときは、Issue で提案したうえで `docs/<言語コード>/code/` を作り、Introduction と Key Terms から始めてください。サイトへの組み込み（言語切り替えへの追加）はメンテナーが行います。

## あなたも Project Sprint づくりに参加してみませんか

プロジェクトを推進するための実践的な方法論やプロジェクトチームのあり方に興味がある方、プロジェクト推進に関するご自身の経験や知識を何らかの形で役立てたいと考えてくださる方を広く歓迎します。現在メンバーは、週次でミーティングを実施し、月次で Project Sprint のアップデートを行っています。参加中のメンバーは [Community](https://www.projectsprint.org/community/maintainers) をご覧ください。
