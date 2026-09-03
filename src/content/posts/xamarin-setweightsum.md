---
title: "XamarinでSetWeightSum"
description: "AndroidとXamarin.AndroidでWeightSumの仕様が少し違います。 2行目のと …"
pubDate: "2019-07-18T10:28:28+09:00"
updatedDate: "2019-07-18T10:32:55+09:00"
categories: ["xamarin-android"]
tags: ["Android", "SetWeightSum", "Xamarin"]
wpId: 87
oldUrl: "/2019/07/18/xamarin%E3%81%A7setweightsum/"
---

AndroidとXamarin.AndroidでWeightSumの仕様が少し違います。

2行目のとこです

```
LinearLayout layout=new LinearLayout();
layout.WeightSum=3;
```

Xamarinの場合こうすればできます。

Xamarinは関数ではなくプロパティを使っているんですね。  
たしかにこっちのが楽かも。でもAndroidと混乱する。
