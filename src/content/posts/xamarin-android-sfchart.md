---
title: "Xamarin.AndroidでSfChart"
description: "Xamarin.Androidでグラフ表示したい場合、SfChartがおすすめです。 Xamarin …"
pubDate: "2019-10-30T16:01:37+09:00"
updatedDate: "2019-10-30T16:06:30+09:00"
categories: ["xamarin-android"]
wpId: 212
oldUrl: "/2019/10/30/xamarin-android%E3%81%A7sfchart/"
---

Xamarin.Androidでグラフ表示したい場合、SfChartがおすすめです。

Xamarin.AndroidでのSfChartの使い方を紹介します。

## インストール

VisualStudioでXamarin.Androidプロジェクトを開いて、  
プロジェクト/NuGetパッケージの管理  
を選択

![](/wp-content/uploads/2019/10/image-14.png)

Xamarin.Android SfCharで検索してインストール。下の画像では上から二つ目のやつですね。

![](/wp-content/uploads/2019/10/image-15-1024x503.png)

## ライセンスを取得

公式のライセンスの導入に関するドキュメントは[ここ](https://help.syncfusion.com/common/essential-studio/licensing/license-key)です

[https://www.syncfusion.com/downloads/communitylicense](https://www.syncfusion.com/downloads/communitylicense) でアカウントを取得してログインします。 LinkedIn のアカウントが必要なので、持ってなかったらそれも取ってください。

ログインしたら、トップページからGet License Keyを選んで、PlatformをXamarinにして、プロジェクト名を入れて、取得。

![](/images/external/syncfusion-d610b6.png)

取得したライセンスキーは無くさないようにメールアドレスにも転送を指定しておきましょう。

VisualStudioでXamarinプロジェクトを開いて、SfChartの機能を使う前に

```
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense("YOUR LICENSE KEY");
```

を宣言すれば使えます。

## SfChartチュートリアル

線グラフを書いてみます。  
公式のチュートリアルは[ここ](https://help.syncfusion.com/xamarin-android/sfchart/getting-started)に書いてあるので、詳しく知りたい場合は参照してください。

namespaceを宣言します。

```
using Com.Syncfusion.Charts;
```

データをグラフに渡すクラスを作ります。  
理屈はよくわからないですが、変数にgetterとsetterを付けないとSfChartが反応してくれないです。詳しい人教えてほしい。

```
public class DateData
{
    public string Date { get; set; }
    public double Value { get;set; }
}
```

線グラフを作ります

```
SfChart chart = new SfChart(context);
chart.Title.Text = "Chart";
chart.SetBackgroundColor(Color.White);

CategoryAxis primaryAxis = new CategoryAxis();
primaryAxis.Title.Text = "日";
chart.PrimaryAxis = primaryAxis;

NumericalAxis secondaryAxis = new NumericalAxis();
secondaryAxis.Minimum = 0;
secondaryAxis.Maximum = 10;
chart.SecondaryAxis = secondaryAxis;

List<DateData> data = new List<DateData>()
{
      new Data{Text="10/24",Value=1},
      new Data{Text="10/25",Value=2},
      new Data{Text="10/26",Value=3},
      new Data{Text="10/27",Value=4},
      new Data{Text="10/28",Value=5},
      new Data{Text="10/29",Value=6},
      new Data{Text="10/30",Value=7},
};
LineSeries series = new LineSeries();
series.ItemsSource = data;
series.XBindingPath = "Text";
series.YBindingPath = "Value";
series.Label = "時間";
chart.Series.Add(series);
```

グラフをビューに追加します。

```
layout.AddView(lineChart);
```

![](/wp-content/uploads/2019/10/image-16.png)

ちょっと自分もよくわかってないんですけど、SfChartを入れるレイアウトを大きめに設定しないとうまく表示されなかったです。
