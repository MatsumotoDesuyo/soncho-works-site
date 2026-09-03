---
title: "XamarinでsetLayoutParams"
description: "Xamarin.AndroidでsetLayoutParamsをする方法です。 4行目のところです。 …"
pubDate: "2019-07-18T10:43:52+09:00"
updatedDate: "2019-07-18T10:45:50+09:00"
categories: ["xamarin-android"]
wpId: 92
oldUrl: "/2019/07/18/xamarin%E3%81%A7setlayoutparams/"
---

Xamarin.AndroidでsetLayoutParamsをする方法です。

4行目のところです。

```
LinearLayout layout=FindViewById<LinearLayout>(Resource.Id.linearLayout1);
LinearLayout.LayoutParams layoutParams = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MatchParent, LinearLayout.LayoutParams.MatchParent);

layout.LayoutParameters=layoutParams;
```

AndroidではsetLayoutParamse(parameter)と関数での実装でしたが  
Xamarinは関数ではなくプロパティにしてあるんですね。
