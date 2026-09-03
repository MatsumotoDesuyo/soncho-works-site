---
title: "Xamarin.Androidでグラフ表示"
description: "XamarinにもAndroidにもグラフを表示するViewが無いので、グラフを使いたい場合はどこか …"
pubDate: "2019-10-30T15:02:39+09:00"
updatedDate: "2019-10-30T16:07:17+09:00"
categories: ["xamarin-android"]
wpId: 210
oldUrl: "/2019/10/30/xamarin-android%E3%81%A7%E3%82%B0%E3%83%A9%E3%83%95%E8%A1%A8%E7%A4%BA/"
---

XamarinにもAndroidにもグラフを表示するViewが無いので、グラフを使いたい場合はどこかからライブラリを持ってくる必要があります。

紹介するのは全てNuGetで検索すれば取得できます。

## どのライブラリにするか

### SfChart

使ってみたところ一番おススメ。

公式のドキュメントが豊富で安心感ある。しかもXamarin.Android、Forms、iOSそれぞれで別のページ作ってくれてるし  
[https://help.syncfusion.com/xamarin-android/sfchart/getting-started](https://help.syncfusion.com/xamarin-android/sfchart/getting-started)

ただし日本語ドキュメントも日本語で紹介しているWebサイトも現状無いと言っていいです。Google翻訳と自身の英語力で頑張りましょう。

ただしライセンスを取らないと使えないのが手間。少人数の開発ならコミュニティライセンスを無料で取れます。SfChartを呼び出す際にライセンスを宣言すれば使えます。

### MPAndroidChart

Androidでよく使用されているらしいグラフ機能。

公式のドキュメントは無いけど、Android開発でMPAndroidChartを解説している日本語のWebサイトが結構あるので導入しやすいです。

Xamarin.Android環境での解説はほぼゼロなので、JavaからC#への変換を察せる人向け。

### Oxyplot

Oxyplotが出してるグラフ表記ライブラリ。  
紹介する中では個人的には一番おススメしません。

とても悲しいのがまともな公式ドキュメントが無いこと。使用にあたって勘が試されます。

でも”Xamarin.Android グラフ”で検索すると、日本語で解説しているWebページがそれなりにあります。そういう点でこれを選ぶ人もいるでしょう。

あとレーダーチャート機能に非対応でした。
