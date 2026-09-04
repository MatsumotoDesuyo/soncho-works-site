---
title: "Vector3を複製する"
description: "Vector3を複製しましょう。 複製する必要が無いケース Transform.positionから …"
pubDate: "2019-07-23T14:47:56+09:00"
updatedDate: "2019-07-23T14:47:57+09:00"
categories: ["dev-notes"]
wpId: 100
oldUrl: "/2019/07/23/vector3%E3%82%92%E8%A4%87%E8%A3%BD%E3%81%99%E3%82%8B/"
---

Vector3を複製しましょう。

## 複製する必要が無いケース

Transform.positionから値を取得する場合はVector3を複製する必要はありません。

```
Vector3 v1 = transform.position;
Vector3 v2 = transform.position;
v1.x = 100;
print(v1);
print(v2);
//v1とv2のxの値は異なる
```

Transform.positionから値を取得する際は、新たにインスタンスを生成して渡してくれるので、そもそもVector3を複製する必要はありません。

## 複製したい場合

拡張メソッドでClone関数を作りましょう。

```
public static class Extend
{
    public static Vector3 Clone(this Vector3 vec)
    {
        return new Vector3(vec.x, vec.y, vec.z);
    }
}
```

使う際は下のようなかんじで使います

```
void sample(Vector3 vec)
{
    Vector3 tmp=vec.Clone();
}
```

以上です。コピーして使ってください。
