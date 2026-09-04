---
title: "'Fragment'は旧型式です This class is obsoleted in this android platform"
description: "Xamarin.Androidでソリューションエクスプローラ/追加/新規追加/フラグメントでフラグメ …"
pubDate: "2019-10-27T15:45:52+09:00"
updatedDate: "2019-10-27T15:45:59+09:00"
categories: ["dev-notes"]
wpId: 206
oldUrl: "/2019/10/27/fragment%E3%81%AF%E6%97%A7%E5%9E%8B%E5%BC%8F%E3%81%A7%E3%81%99-this-class-is-obsoleted-in-this-android-platform/"
---

Xamarin.Androidでソリューションエクスプローラ/追加/新規追加/フラグメントでフラグメントを作成すると

![](/wp-content/uploads/2019/10/image-13-1024x228.png)

Fragmentは旧型式ですと出る。

原因は、Android Pie以降Fragmentの仕様が変わりネームスペースが変更されたけどもXamrinでフラグメントを作成するとデフォルトで旧バージョンのネームスペースを参照しようとするため。

```
using Android.App;
```

のところを

```
using Android.Support.V4.App;
```

に置き換えれば解決されます。
