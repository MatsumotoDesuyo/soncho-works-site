---
title: "XamarinでSystem.TypeInitializationException: The type initializer for 'MySql.Data.MySqlClient.Replication.ReplicationManager' threw an exception."
description: "XamarinでMySqlを使おうとしたらこのエラーが出て2日くらい詰まってました。 解決方法をシェ …"
pubDate: "2019-10-12T16:46:00+09:00"
updatedDate: "2019-10-12T16:50:17+09:00"
categories: ["xamarin"]
tags: ["MySQL"]
heroImage: "/wp-content/uploads/2019/10/image-11.png"
wpId: 188
oldUrl: "/2019/10/12/xamarin%E3%81%A7system-typeinitializationexception-the-type-initializer-for-mysql-data-mysqlclient-replication-replicationmanager-threw-an-exception/"
---

XamarinでMySqlを使おうとしたらこのエラーが出て2日くらい詰まってました。

解決方法をシェアしたいと思います。

## エラーが出る場所

```
MySqlConnectionStringBuilder builder = new MySqlConnectionStringBuilder()
            {
                Server = "sample.com",
                Port = 3306,
                Database = "test",
                UserID = "id",
                Password = "password",
            };

            MySqlConnection connection = new MySqlConnection(builder.ToString());
            

            try
            {
                if (connection.State == ConnectionState.Closed)
                {
                    connection.Open();
                    Log.Debug("connect", "true");
                }
            }
            catch(MySqlException e)
            {
                Log.Debug("connect", e.ToString());
            }
```

17行目のconnection.Open();のところで

```
System.TypeInitializationException: The type initializer for 'MySql.Data.MySqlClient.Replication.ReplicationManager' threw an exception.
```

が出ました。

## 解決方法

Xamarin(Visual Studio)でMySqlを使うにはNuGetからMySqlのパッケージをインストールする必要があります。

ツール/NuGetパッケージマネージャ/ソリューションのNuGetパッケージの管理を選択してNuGetの管理画面に行き、

参照を選択して”xamarin mysql”と検索します。

![](/wp-content/uploads/2019/10/image-11-1024x534.png)

このときMySqlと名の付くパッケージがいろいろ出てきますが、

**Xamarin.MySql.Dataをインストールしてください**

自分の方でSystem.TypeInitializationExceptionが出てきたのは、間違えてMySql.Dataをインストールしていたからです。

**System.TypeInitializationException が出ている方は、MySql.DataをアンインストールしてからXamarin.MySql.Dataをインストールしてください。**

以上です！

普通にGoogleで”C# MySql”とかで検索するとMySql.Dataのパッケージの方が出てくるので騙されますが、Xamarinの場合はXamarin.MySql.Dataの方だったんですね！

お疲れ様です！
