---
title: "LANでSynologyに独自ドメインでアクセスする"
description: "この記事は、SynologyでWordPressサイトを独自ドメインで作るの一行程として書きました。 …"
pubDate: "2019-10-02T15:31:43+09:00"
updatedDate: "2019-10-31T17:27:51+09:00"
categories: ["synology"]
tags: ["DDNS"]
wpId: 161
oldUrl: "/2019/10/02/lan%E3%81%A7synology%E3%81%AB%E7%8B%AC%E8%87%AA%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%A7%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B9%E3%81%99%E3%82%8B/"
---

この記事は、[SynologyでWordPressサイトを独自ドメインで作る](http://synology上でブログを上げるのが大変だったっていう話)の一行程として書きました。

この記事では、DDNSを取得し、Synologyに設定していることを前提とします。

SynologyでWordPressを作る人以外でも、独自ドメインを取って登録したのにSynologyにLAN内でアクセスできないという人の役にも立つと思います。

## LAN内でのみSynologyにアクセスできない

**DDNSを設定しても、LANの中からは接続できません！（重要）**

理屈は難しいので、わからない人は次の項まで読み飛ばしていいです。

LANから接続できないのは、**DDNSが返すIPアドレスはグローバルIP**だからです

**LAN内から端末にアクセスするにはローカルIPを呼ぶ必要があります**

そのため、WANからSynologyに独自ドメインでアクセスする場合はグローバルIPを、LANからアクセスする場合はローカルIPをなんとかしてそれぞれ取得できるようにしないと、外出先では編集出来るけど家の中ではアクセスできない悲しいブログが誕生します。

わけわからねえよとお思いかもしれませんが、私もはじめわけわかんなかったです！

ブログ解説に向けて頑張りましょう！

## SynologyにDNSを立てる

WANではグローバルIP、LANではローカルIPを取得できるようにするにはどうするか。

WANにいるときはDDNSからグローバルIPを取得し、**LAN内にいるときはLAN独自のDNSにIPを問い合わせしてローカルIPを取得するようにしましょう。**

Synologyの**DNS Server**を使えば実装できます

こんな機能まで用意してくれているなんて、Synologyは素晴らしいですね。大好きです。

DNS Serverをインストールして設定するのは、私が説明するよりもこのサイトを参照された方がわかりやすいです！

[自宅内DNSサーバーの構築～DiskStation DS218j](https://wwq.mydns.jp/496/)

手抜きですみません！

## LANでSynologyのDNSに接続

SynologyでDNSサーバーを立てることができたら、LANにいるときにSynologyのDNSを自動で参照するようにしましょう。

### Windowsの場合

Macの人はすみませんわかんないです。

まずはSynologyと同一のLAN（Wifi）に接続しましょう。

コントロールパネルを開き、ネットワークとインターネット→ネットワークと共有センターを選択

↓の画像の矢印のところ、今接続しているLANのWifiを選択

![](/wp-content/uploads/2019/10/image-4-1024x377.png)

プロパティを選択

![](/wp-content/uploads/2019/10/image-6-953x1024.png)

インターネットプロトコルバージョン4(TCP/IPv4)を選択し、プロパティをクリック

![](/wp-content/uploads/2019/10/image-7-805x1024.png)

次のDNSサーバーのアドレスを使うにチェックを入れる

![](/wp-content/uploads/2019/10/image-8.png)

DSMに戻り、SynologyのローカルIPを調べましょう。  
コントロールパネル→ネットワーク→ネットワークインターフェース→LANで調べられます

![](/wp-content/uploads/2019/10/image-9-1024x585.png)

調べたIPを、優先DNSサーバーのところへ入れましょう。

![](/wp-content/uploads/2019/10/image-10-908x1024.png)

ついでに代替DNSサーバーにWifiのローカルIPでも入れて置けば、Synologyが壊れた時でも代替DNSでネットに繋げられるのでいいと思います。

これでLANにいるときに、Synologyに独自ドメインでアクセスできるようになりました！

お疲れ様でした！
