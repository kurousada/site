+++

title       = "【無料】Github Pages で独自ドメインを使う"
type        = "post"
author      = "Kuro Usada"
categories  = ["tech", "github"]
date        = "2017-10-30T17:09:43+09:00"
description = "How to use your original domain for free with github pages"
draft       = false
toc         = true

featured = true
featuredlocation = "https://pixabay.com/photo-2543658/"
featuredtitle = "An image"
featuredcopyright = "kellepics"
featuredcopyrightlink = "https://pixabay.com/ja/users/kellepics-4893063/"

+++

このサイトはGithub Pagesを使っています。自分のメモも兼ねて、無料で独自ドメインを取得して Github Pages で使う方法をご紹介します。

<!--more-->

## タダで独自ドメインを取得するには

[Freenom](http://www.freenom.com/ja/index.html) というドメイン取得サービスがあり、以下のドメインは無料で取得できます。

 - .tk（トケラウ諸島）
 - .ml（マリ共和国）
 - **.ga**（ガボン共和国）← うちはこれです。
 - .cf（中央アフリカ）
 - .gq（赤道ギニア）

12ヶ月に一度更新する必要はありますが、URL 転送・Freenom DNS・独自の DNS サーバの利用などが**無料**でできます。

## 欲しいドメイン名を取得する

[Freenom](http://www.freenom.com/ja/index.html) のページへ行き、真ん中の入力欄に欲しいドメイン名を入力します。

{{< fig file="screenshot01.png" title="Freenom" link="http://www.freenom.com/ja/index.html" >}}

すると、そのドメイン名が取得できるかどうかが表示されるのでリストの中から探して「今すぐ入手」ボタンを押します。
ドメイン名が選択されたら「チェックアウト」ボタンを押し、「Period」を「**12 months @ FREE**」にして「Continue」をクリックします。

{{< fig file="screenshot02.png" title="取得可能なドメイン名のリストが表示される" >}}
{{< fig file="screenshot03.png" title="Period 以外はそのままでよい" >}}

「Total Due Today」が「$0.00USD」であることを確認し、ログインします。私は Google Account を使いました。
ログインすると、そのドメインに登録する情報を入力する画面が出てきますので空欄を埋めて「Compelete Order」を押すと注文完了です。

{{< fig file="screenshot04.png" title="ここで登録した情報がドメイン取得に使われる" >}}

## DNS の設定

Github Pages の URL をエイリアスに設定し、取得したドメイン名でサイトにアクセスできるようにします。

Freenom には「**Freenom DNS**」という無料で利用できる DNS がありますので、それを使います。
独自の DNS を指定して使うこともできます。

Freenom にログインした状態でページ上部の「Services」から「My Domains」を選ぶとそのアカウントが持っているドメインの管理画面が表示されます。

{{< fig file="screenshot05.png" title="Kuro Usada の My Domains" >}}

「Manage Domain」をクリックしてドメインごとの管理画面に飛んで「Manage Freenom DNS」を選ぶと DNS にレコードを設定できる画面になります。

{{< fig file="screenshot06.png" title="kurousada.ga のドメイン管理画面" >}}

ここで「Type」を「**CNAME**」にし、「Target」に「Github Pages のサイト URL」を入れ、「Save Changes」を押すとレコードが追加されてエイリアスが設定されます。
「Name」は空欄で構いません。

{{< fig file="screenshot07.png" title="Freenom DNS の設定画面（すでに CNAME を追加してある）" >}}

独自のDNSを使いたい場合は、ドメインごとの管理画面の「Management Tools」から「Nameservers」を選ぶと設定できます。

## Github Pages の設定

Github Pages ではリポジトリのルートにドメイン名を書いた`CNAME`というファイルを置いておくと CNAME レコードを設定でき、ホスト名として書いたドメイン名を使うことができるようになります。

```
$ echo 'kurousada.ga' > CNAME
$ git commit -am 'add CNAME'   # CNAME ファイルをコミット
$ git push origin master       # Github のレポジトリに Push して反映
```

## これで完了

以上で独自ドメインを使って Github Pages を運用することができるようになります。
しかもドメインの取得や維持も**無料**です。素晴らしい。
機会があれば、ぜひ試してみてください。
