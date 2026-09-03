---
title: "Android Studioで右端折り返し"
description: "Android Studioでコードを書いていて、ウィンドウの右を超えた時に右にスクロールされるので …"
pubDate: "2019-12-21T18:56:36+09:00"
updatedDate: "2019-12-21T18:56:40+09:00"
categories: ["uncategorized"]
wpId: 259
oldUrl: "/2019/12/21/android-studio%E3%81%A7%E5%8F%B3%E7%AB%AF%E6%8A%98%E3%82%8A%E8%BF%94%E3%81%97/"
---

Android Studioでコードを書いていて、ウィンドウの右を超えた時に右にスクロールされるのではなく下に自動で折り返す方法です。

Windowsの場合、  
File/Settings/Editor/Generalと開いていき、

Soft Wrapsの中にあるSoft-wrap filesの中に折り返し表示をさせたいファイルの拡張子を入力します。

![](/wp-content/uploads/2019/12/image-1024x151.png)

各拡張子の区切りが “**;**” なのに注意です。

自分は最初”,” で区切ってしまって動かなくてテンパりました。

![](/wp-content/uploads/2019/12/image-2.png)

これで折り返しされるはずです！

![](/wp-content/uploads/2019/12/image-3-1024x144.png)

ちなみにSoft Wraps欄の中にある、Soft-wrap files以外の項目の紹介もしときます。

Use original line’s indent for wrapped parts にチェックを入れてAdditional shift に数値を入れると改行した時にインデントが入るようになります。  
上のコードはインデント１つ入れてます。

Show soft wrap indicators for current line onlyにチェックを入れると折り返し時のくるっと曲がってる矢印アイコンが表示されなくなります。  
自分は表示させてますね。

以上っす！お疲れ様でした！
