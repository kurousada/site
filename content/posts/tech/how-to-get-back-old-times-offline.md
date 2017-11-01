+++

title       = "オフラインでも懐かしいあの頃に戻る方法"
type        = "post"
author      = "Kuro Usada"
categories  = ["tech"]
date        = "2017-10-31T18:44:17+09:00"
description = "How to get back old times offline"
draft       = false
toc         = true

featured = true
featuredlocation = "https://pixabay.com/photo-2569573/"
featuredtitle = "A photo"
featuredcopyright = "StockSnap"
featuredcopyrightlink = "https://pixabay.com/ja/users/StockSnap-894430/"

+++

個人運営の『ホームページ』が幅を利かせていた懐かしのあの頃。
今ではもう消滅してしまい、Google 検索しても「404 Not Found」になってしまうサイトも数多くあります。
そういったサイトでも [Wayback Machine](https://archive.org/web/) で検索すればだいたい出てくるのですが、もちろんオンラインでしか見ることができません。
そこで Wayback Machine に残っている snapshot からサイトをオフラインに復元する方法をお教えします。

<!--more-->

## Internet Archive: Wayback Machine

世界中のサイトのアーカイブ（コピー）を閲覧できるサービスがあります。
Internet Archive という団体が運営する [Wayback Machine](https://archive.org/web/) という**無料のサービス**です。

{{< fig file="screenshot01.png" title="Internet Archive: Wayback Machine" link="https://archive.org/web/" >}}

Wayback Machine は世界中のサイトを巡り、snapshot と呼ばれる巡回時点でのサイトのコピーを保存しています。
サイトの URL さえわかれば、**今はもう消滅してしまったサイトでも閲覧できる**のです。

当然、このサービスは**オフラインでは使えません**。
ネットがないところでこそあの古き良き時代を思い出したいのに！
一々サイトにアクセスして URL 打つとか無理……！

## Wayback Machine Downloader

そんな人々の願いに応えるコマンドがあります。
[Wayback Machine Downloader](https://github.com/hartator/wayback-machine-downloader) です！
Ruby 製のコマンドなので、おそらく Windows や Mac でも動くでしょう、たぶん。

### インストール

```
## ruby >= 1.9.2 が必要です
$ sudo gem install wayback-machine-downloader
```

### 使い方

```
$ wayback_machine_downloader -d [保存先ディレクトリ] [URL]
```

指定する URL は Wayback Machine の URL （https\://web.archive.org/web/〜）ではなく、保存したいサイトの URL です。

よく使うオプションは

```
  -d, --directory  保存先のディレクトリ（デフォルトは ./websites/[domain-name]）
  -t, --to         指定したタイムスタンプ以前の snapshot に限る（タイムスタンプは「2016」や「20160708」など）
  -f, --from       指定したタイムスタンプ以後の snapshot に限る（--to の逆）
  -l, --list       実際にダウンロードはせず、JSON で情報を出力
```

他のオプションについての詳しい説明は[公式を参照してください](https://github.com/hartator/wayback-machine-downloader)。

{{% note %}}`-c`または`--concurrency`に 10 とか設定すれば並列ダウンロードできるようですが、手元の環境では取得できないファイルがありました。{{% /note %}}

## ダウンロードしたファイルを閲覧する

ダウンロードができたら直接ファイルを覗いて人力脳内レンダリングしてもいいのですが、せっかくなのでローカルサーバを立てましょう。
特に相対リンクや CGI がある場合はサーバを立てたほうが楽に見れます。

「よしっ、じゃあ Apache を……」「いやいや、nginx だろ jk」なんて考えた方がいるかもしれませんが、そんなめんどくさいことはしません。
**ワンライナーで十分**です。

### 静的ファイルのみ

ダウンロードしたディレクトリでおもむろにコマンドを叩きます。

```
$ python3 -m http.server 8080    ## Python 3
## または
$ python2 -m HTTPServer 8080     ## Python 2
```

### CGI もあるとき

同じくダウンロードしたディレクトリでおもむろにコマンドを叩きます。

```
$ python3 -m http.server --cgi 8080    ## Python 3
## または
$ python2 -m CGIHTTPServer 8080        ## Python 2
```

CGI ファイルはカレントディレクトリの`cgi-bin`に入れておいてください。

## いざ、タイムスリップ

さあ、ブラウザで`localhost:8080`にアクセスしましょう。

すると……おお！あの頃の思い出が蘇ってきます……！！
やったー！
