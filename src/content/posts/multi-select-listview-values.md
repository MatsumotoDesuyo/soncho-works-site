---
title: "複数選択ListViewの値を取得する"
description: "環境はXamarin.Android。 3行目のとこです。 CheckedItemPositions …"
pubDate: "2019-07-18T17:42:15+09:00"
updatedDate: "2019-07-18T17:42:16+09:00"
categories: ["dev-notes"]
tags: ["ListView", "複数"]
wpId: 98
oldUrl: "/2019/07/18/%E8%A4%87%E6%95%B0%E9%81%B8%E6%8A%9Elistview%E3%81%AE%E5%80%A4%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B/"
---

環境はXamarin.Android。

3行目のとこです。

```
ListView listView=FindViewById<ListView>(Resource);

Android.Util.SparseBooleanArray check = listView.CheckedItemPositions;

for (int i = 0; i < length; i++)
{
    System.Diagnostics.Debug.WriteLine(check.Get(i));
}
```

CheckedItemPositionsで、各項目がチェックされているかどうかの情報を取得できます。

そしてGet(num)で、bool型でチェックされているかを取得します。

この方法が一番楽かなと思います。  
AndroidでもCheckItemPositionsを GetCheckedItemPositions()にすれば同様に動きます。
