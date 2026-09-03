---
title: "アプリはインストールされていません Xamarin.Android"
description: "Androidでアプリ開発をしている時に、USBデバッグは上手くいったのにapkファイルで配布しよう …"
pubDate: "2019-11-20T11:04:48+09:00"
updatedDate: "2019-11-20T11:04:53+09:00"
categories: ["xamarin-android"]
heroImage: "/wp-content/uploads/2019/11/67516.jpg"
wpId: 250
oldUrl: "/2019/11/20/%E3%82%A2%E3%83%97%E3%83%AA%E3%81%AF%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%81%95%E3%82%8C%E3%81%A6%E3%81%84%E3%81%BE%E3%81%9B%E3%82%93%E3%80%80xamarin-android/"
---

![](/wp-content/uploads/2019/11/67516-576x1024.jpg)

Androidでアプリ開発をしている時に、USBデバッグは上手くいったのにapkファイルで配布しようとすると「アプリはインストールされていません」が出る場合、権限の問題である可能性があります。

どうやらAndroidで野良アプリをインストールする際、セキュリティーの観点から特定のパーミッションを要求するアプリを自動で弾いているみたいです。

これは**アプリに署名してから配布することで回避**できました。

## 署名する（Xamarin.Android）

自分の開発環境がXamarinなのでそれで説明します。

別の開発環境で開発されている方はそれで検索してください。

[Xamarinのドキュメントの署名のページ](https://docs.microsoft.com/ja-jp/xamarin/android/deploy-test/signing/?tabs=windows)を元にして書いています。よかったら参照ください。

ツール/アーカイブマネージャを選択し、アーカイブマネージャを開き、アーカイブをします。アーカイブの方法については[こちら](https://docs.microsoft.com/ja-jp/xamarin/android/deploy-test/release-prep/index?tabs=windows)が詳しいです。結構下にドラッグしないとアーカイブ項目までたどり着けないけど。

アーカイブしたら、右下にある配布を選択します。

![](/wp-content/uploads/2019/11/aa-1024x422.png)

アドホックを選択

![](/wp-content/uploads/2019/11/image-1024x579.png)

プラスを選択

![](/wp-content/uploads/2019/11/image-1-1024x586.png)

エイリアスに、表に出る偽名的なやつを入力。まあユーザー名みたいな。  
パスワード、あとその下の個人情報をいずれか一つでいいので入力してから作成。

![](/wp-content/uploads/2019/11/image-2-820x1024.png)

作成した署名を選択して、名前を付けて保存

![](/wp-content/uploads/2019/11/image-3-1024x581.png)

アーカイブに戻ってディストリビューションを開くを選べば、署名付きのapkファイルのあるディレクトリに飛びます。

![](/wp-content/uploads/2019/11/aa-1-1024x433.png)

以上で署名が完了です！お疲れ様でした！
