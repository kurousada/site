+++

title       = "Linux Mintのログイン画面のテーマを自作する"
type        = "post"
author      = "Kuro Usada"
categories  = ["tech", "Linux", "Linux Mint"]
date        = "2017-10-29T17:25:54+09:00"
description = "How to create login themes on Linux Mint"
draft       = false
toc         = true

featured              = true
featuredtitle         = "Linux Mint default login theme"

+++

Linux Mint のログイン画面は HTML で書くことができます。
好きな背景を使ったり、いろいろとカスタマイズできるのです。
今回はそのやり方をご紹介します。

<!--more-->

{{< note >}}
今回の記事は <a href="https://community.linuxmint.com/">Linux Mint Community</a> の <a href="https://community.linuxmint.com/tutorial/view/1336">How to create a MDM HTML5 Greeter Theme</a> を参考にしています。
{{< /note >}}

## Mint Display Manager (MDM)

Linux Mint のデフォルトディスプレイマネージャには MDM が使われています。
Ubuntu などでもインストールすれば使えるようです。

普通、ログイン画面は予め用意されている『テーマ』をインストールして使用しますが、自分の『テーマ』を作り適用することで自分好みのログイン画面を作ることができます。

今回は HTML を使ってテーマを作ります。

## まずはベースをコピー

一からすべて作り上げるのは面倒です。
そこで、既存のテーマをカスタマイズしてオリジナルテーマを作ります。

MDM の HTML テーマは`/usr/share/mdm/html-themes`にあります。

今回は「[Carbon](https://github.com/linuxmint/mint-mdm-themes/tree/master/mint-mdm-themes-html/usr/share/mdm/html-themes/Carbon)」というテーマをベースにしていこうと思いますので、フォルダごとコピーします。

```
$ cd /usr/share/mdm/html-themes
$ sudo cp -r ./Carbon ./MyTheme
```

{{< note >}}
<a href="https://github.com/chrislawlor/mdm-project-template">MDM HTML Project Template</a> というテンプレートもあるようです。
{{< /note >}}

## テーマをいじる

エントリポイントは`index.html`で、`theme.info`にテーマの名前などを書きます。

中身は HTML ですが`$lsb_description`など、いくつか置換される変数があります。
が、詳しいドキュメントが見つからなかったので元のテーマを参考に雰囲気でなんとかしました。

また、確認のために一々ログアウトするのはアホくさいので「MDM Theme Emulator」というエミュレータが公式に用意されています。
起動して「開く」からテーマフォルダを選ぶとエミュレートされ、「更新」を押すことで更新できます。

```
$ /usr/bin/mdm-theme-emulator
```

{{< fig file="screenshot01.png" title="MDM Theme Emulatorを起動したところ" >}}

## テーマを適用する

テーマが完成したら出来上がったテーマをログイン画面に適用します。

```
$ sudo /usr/sbin/mdmsetup
```

ログイン画面の設定が出てくるので一覧から自分が作ったテーマを選び、適用します。
右上の歯車のアイコンをクリックするとプレビューできます。

{{< fig file="screenshot02.png" title="ログイン画面の設定" >}}

最後に、一度ログアウトして適用されているか確認しましょう。

以上です。
これで萌え萌えログイン画面でも超スタイリッシュなログイン画面でも、好きなログイン画面が作れます！
