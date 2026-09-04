---
title: "<が&lt;になる"
description: "WordPress + Syntax Highlighter で「<」が「&lt;」に変換されてしまう問題を、段落を Classic Paragraph 経由でカスタム HTML に変換して解決する手順。"
pubDate: "2019-12-27T02:08:35+09:00"
updatedDate: "2019-12-27T02:12:12+09:00"
categories: ["dev-notes"]
wpId: 310
oldUrl: "/2019/12/27/%E3%81%8Clt%E3%81%AB%E3%81%AA%E3%82%8B/"
---

WordPressでSyntax Highlighterを使っていた、”<“が”& lt;”になり、<を書いたら”& amp;lt;”になってマジでどうしたらええねんってなった人の為の最終解決法。

段落をClassic Paragraphにする

![](/wp-content/uploads/2019/12/image-4-300x259.png)

もっかい変換を選択し、カスタムHTMLにする

![](/wp-content/uploads/2019/12/image-6-300x242.png)

preから全部書く

![](/wp-content/uploads/2019/12/image-5-1024x265.png)

上手くいきました

![](/wp-content/uploads/2019/12/image-7-1024x136.png)
