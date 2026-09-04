---
title: "NFCタグから開発したAndroidアプリを起動する"
description: "まだアンドロイド開発に慣れきっていない。修行中のそんちょーです。 最近NFCタグを使ったアプリを作っ …"
pubDate: "2019-12-27T01:13:27+09:00"
updatedDate: "2019-12-27T02:19:53+09:00"
categories: ["dev-notes"]
wpId: 276
oldUrl: "/2019/12/27/nfc%E3%82%BF%E3%82%B0%E3%81%8B%E3%82%89%E8%87%AA%E5%88%86%E3%81%AE%E3%82%A2%E3%83%97%E3%83%AA%E3%82%92%E8%B5%B7%E5%8B%95%E3%81%99%E3%82%8B/"
---

まだアンドロイド開発に慣れきっていない。修行中のそんちょーです。

最近NFCタグを使ったアプリを作っていて、アプリ内でNFCタグを読み込む方法の記事はあっても、  
ホーム画面とかで特定のNFCタグを読み込んだ際に開発したアプリを起動し、  
その読み込んだNFCの情報をアプリ内で受け取る方法がなかなか見つからなかったので残しておきます。

言語はKotlinです。

アプリ内でのNFCの読み書きの方法を知りたい方は、[ここのサイト様](https://www.dcom-web.co.jp/lab/mobile/android/nfc_tutorial1)がめちゃくちゃ丁寧でわかりやすかったので先にそちらを参考にどうぞ。

## AndroidManifest

見てもらいたいのは17-21行目のintent-filterです。

intent-filterに指定した条件に引っかかったときに特定のアクティビティが呼び出されます。

上の例では、NDEFを発見した時かつ、NFCに設定されたmimeTypeがtext/customeHereだった時に呼び出されるようになっています。

mimeTypeを指定しないでいると、あらゆるNFCを読み込んだ時に起動する迷惑なアプリが誕生します。

customeHeraの部分を編集して、自分のアプリで書き込んだNFCからしか起動しないようにしましょう。

## NFCに特定のmimeTypeを書き込む。

次にNFCタグにmimeTypeを設定しましょう。

```
fun writeNfc(intent:Intent){
        val text ="write-test"

        if(NfcAdapter.ACTION_TECH_DISCOVERED==intent.action||
            NfcAdapter.ACTION_NDEF_DISCOVERED==intent.action){
            val tag=intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)?:return;
            val ndef=Ndef.get(tag)?:return

            if(ndef.isWritable){
                //mimeTypeとテキストをバイト配列で渡す
                val record=NdefRecord(NdefRecord.TNF_MIME_MEDIA,"text/customHere".toByteArray(),
                    byteArrayOf(),"customText".toByteArray())

                val msg = NdefMessage(record);

                ndef.connect()
                ndef.writeNdefMessage(msg)
                ndef.close()
            }
        }
    }
```

この関数を呼べばいいだけです。

11行目のNdefRecord関数の二つ目の引数に自分の設定したいmimeTypeをbyte配列で渡してください。

onCreateからだとintentにNFCタグの情報がまだ埋め込まれてないのでボタンからでも呼び出しましょう。

## NFCでアプリを起動してデータを読む

```
override fun onResume() {
        // タグのIDを取得
        val tagId : ByteArray =intent.getByteArrayExtra(NfcAdapter.EXTRA_ID) ?: return
 
        var list = ArrayList<String>()
        for(byte in tagId) {
            list.add(String.format("%02X", byte.toInt() and 0xFF))
        }

        Lod.d("NFC Id",list.joinToString(":"))
}
```

上の例ではNFCのIDを取得してログに出力してます。

onResume内でintentからデータを取得すればいいだけです。

どうやらonCreate内のintentからでは取得できない様子なのでonResumeを使いましょう。

ここのブロックのコードの8割は[こちら](https://www.dcom-web.co.jp/lab/mobile/android/nfc_tutorial1)から使わせていただきました。
