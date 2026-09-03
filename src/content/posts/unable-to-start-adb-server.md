---
title: "Unable to start adb server"
description: "UnityでAndroid実機ビルドできない このエラーで一日潰しました。辛かった… A …"
pubDate: "2019-08-21T23:38:10+09:00"
updatedDate: "2019-10-01T19:19:19+09:00"
categories: ["unity"]
tags: ["Android", "Unity", "ビルド"]
wpId: 114
oldUrl: "/2019/08/21/unable-to-start-adb-server/"
---

## UnityでAndroid実機ビルドできない

このエラーで一日潰しました。辛かった…

Android端末を接続した状態でBuildAndRunすると↓のエラーが出ます。

```
CommandWithNoStdoutInvokationFailure: Unable to start ADB server. Please make sure the Android SDK is installed and is properly configured in the Editor. See the Console for more details.
```

環境は Unity version 2019.1.8f1です

## 試してみた方が良いこと

-   UnityHubでAndroidBuildSupportがインストールされているどうか
-   Edit/Preference/External Tools/Androidの、JDK、Android SDK、NDK、Gradleにチェックが入っているかどうか

しかし私はそれでも解決しませんでした

## 原因はadb.exeの多重起動

adb.exeというのはandroid platform-toolsに含まれていて、Android端末と接続するときに必要になるexeファイルです。

ADBにPathを通してコマンドプロンプトで確認できるようにし、動作状況を確認してみました。

```
adb devices
List of devices attached
adb server version (32) doesn't match this client (40); killing...
could not read ok from ADB Server

failed to start daemon
error: cannot connect to daemon
```

adbサーバーとクライアントが別々のバージョンで動いているから停止するぜと言いやがります。  
許さん(# ﾟДﾟ)

これはどうやらadb.exeが複数起動しているときに起こるらしいです。

ADBにPathを通すときは[ここのサイト](https://qiita.com/hikaru__m/items/15baae425b6fad25da05)を参照するとわかりやすいです。

## adb.exeを止める

Android端末をPCに接続した状態でタスクマネージャーを開き、adb.exeを見つけて停止しましょう。

adb.exeが消えれば完了。これでUnityでBuildAndRunできるはずです。  
おつかれさまでした！

**私の環境下では消えませんでした(# ﾟДﾟ)**

![](/wp-content/uploads/2019/08/mig.jpg)

## adb.exeを勝手に起動している他のソフトを探す

**他のソフトが勝手にadb.exeを起動しているのが複数起動の原因**でした。

タスクマネージャーのadb.exeを右クリック→ファイルの場所を開くで出所を探したところ、 Splashtop Wired XDisplay というソフトが出てきました。  
どうやらSplashtopは、Android端末をPCに接続した際に自動的にadb.exeを起動し、強制終了されても自動で復活させるということをしているようです。  
許さん。

自分の場合はSplashtopをアンインストールして、完了です。

同じことで困っている方は、**勝手にadb.exeを起動しているソフトが無いか確認するといいと思います！**

お疲れ様でした！
