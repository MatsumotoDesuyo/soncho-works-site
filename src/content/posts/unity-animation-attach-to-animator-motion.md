---
title: "AnimationをAnimatorのMotionにアタッチできない"
description: "AnimatorにAnimationを置いても、StateのMotionがNoneになってしまって動 …"
pubDate: "2019-07-29T19:23:26+09:00"
updatedDate: "2019-07-29T19:23:29+09:00"
categories: ["dev-notes"]
wpId: 103
oldUrl: "/2019/07/29/animation%E3%82%92animator%E3%81%AEmotion%E3%81%AB%E3%82%A2%E3%82%BF%E3%83%83%E3%83%81%E3%81%A7%E3%81%8D%E3%81%AA%E3%81%84/"
---

![](/wp-content/uploads/2019/07/image-4.png)

AnimatorにAnimationを置いても、StateのMotionがNoneになってしまって動かない…

原因は、Animationが旧型式になっていることです。

## Animationを新形式にする

AnimationのInspectorの右上の横棒三本のとこをクリックし、  
Debugを選択します

![](/wp-content/uploads/2019/07/image-5.png)

Legacyのとこのチェックを外せば新形式になります。

![](/wp-content/uploads/2019/07/image-7.png)

これでAnimatorにくっつけられるようになります。
