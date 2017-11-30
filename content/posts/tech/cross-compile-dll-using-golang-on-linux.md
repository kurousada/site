+++

title       = "Goを使ってDLLをクロスコンパイル on Linux"
type        = "post"
author      = "Kuro Usada"
categories  = ["Linux", "tech", "golang", "ukagaka"]
date        = "2017-12-01T19:37:07+09:00"
description = "Cross Compile Dll Using Golang on Linux"
draft       = true
toc         = true

featured              = true
featuredlocation      = "https://blog.golang.org/gopher"
featuredtitle         = "Go Gopher"
featuredcopyright     = "Renee French"
featuredcopyrightlink = "http://reneefrench.blogspot.com/"

+++

[mattn](https://mattn.kaoriya.net/) さんが公開している「[Golang で Windows の DLL を作る方法](https://mattn.kaoriya.net/software/lang/go/20160921010820.htm)」を参考に、cgo を使って Linux 上で DLL をクロスコンパイルします。
Go を使えば、Windows なしで[伺か](https://ja.wikipedia.org/wiki/伺か)の SHIORI.DLL を作成することができます。ので、作ります。

<!--more-->

この記事は [Go Advent Calender 2017（その4）](https://qiita.com/advent-calendar/2017/go4) の 1日目の記事です。

明日は [kami_zh](https://qiita.com/kami_zh) さんによる Linux プログラミング関連の記事だそうです。

## 必要なもの

 - Linux PC
 - [Go](https://golang.org/) （たぶん）1.5以上
 - [MinGW](http://www.mingw.org/)
 - [Wine](https://www.winehq.org/)

この記事は以下の環境で作成しています。

 - [Linux Mint](https://linuxmint.com/) 18.2 Sonya Xfce 64bit
 - Go 1.9.2 linux/amd64 via [goenv](https://github.com/syndbg/goenv)
 - mingw-w64 4.0.4-2 via `apt install mingw-w64`
 - wine-1.6.2 via `apt install wine`

## 全体の流れ

基本的な流れは「[Golang で Windows の DLL を作る方法](https://mattn.kaoriya.net/software/lang/go/20160921010820.htm)」と同じです。

 1. MinGW の GCC を環境変数`CC`に指定して`go build --buildmode=c-archieve`で`libxxx.a`を作る
 2. defファイルを作る
 3. MinGW の GCC で`-Wl,--allow-multiple-definition`を指定して DLL を作る

なお、Linux ネイティブの GCC ではなく、**MinGW の GCC を使う**ことに注意してください。

## とりあえず作ってみる

DLL といえば[伺か](https://ja.wikipedia.org/wiki/伺か)の栞（shiori.dll）ですね！
（え、伺かを「知らない」……？それは……）

mattn さんも「[本物の golang を... 本物の Gopher を、お見せしますよ。](https://qiita.com/mattn/items/b7889e3c036b408ae8bd)」という記事で Pure Go の伺かベースウェア（のようなもの）を実装してましたし！

[SHIORI/3.0 の仕様](http://ssp.shillest.net/ukadoc/manual/spec_dll.html)によると、`shiori.dll`は以下の3つの関数をエクスポートする必要があります。
（伺か？SHIORI？知らねーよ！！って方には後で説明するので、とりあえず下の 3つの関数をエクスポートした DLL を作るんだということを了解していただければと思います）

```C
extern "C" __declspec(dllexport) BOOL __cdecl load(HGLOBAL h, long len);
extern "C" __declspec(dllexport) BOOL __cdecl unload(void);
extern "C" __declspec(dllexport) HGLOBAL __cdecl request(HGLOBAL h, long *len);
```

まずは引数なしで何もしない`unload()`関数を Go で書いてエクスポートしてみましょう。

```golang
package main

/* 
   #include <windows.h>
 */
import "C"

import (
    "fmt"
)

func main(){}

//export unload
func unload() C.BOOL {
    return C.TRUE
}
```

この`main.go`をコンパイルして`libshiori.a`を作ります。

```sh
CGO_ENABLED=1 GOOS="windows" GOARCH="386" CC="i686-w64-mingw32-gcc-win32" go build -buildmode=c-archive -o libshiori.a
```

`libshiori.a`の中から`unload()`をエクスポートするための`shiori.def`ファイルを書きます。

```def
LIBRARY	shiori

EXPORTS
    unload
```

で、この`shiori.def`と`libshiori.a`を基に`shiori.dll`を作ります。

```sh
i686-w64-mingw32-gcc-win32 -shared -o shiori.dll shiori.def libshiori.a -Wl,--allow-multiple-definition -static -lstdc++ -lwinmm -lntdll -lws2_32
```

`shiori.dll`ができました！
オブジェクトファイルに含まれるシンボルを教えてくれる`nm`コマンドで確認してみます。

```sh
$ nm shiori.dll | grep unload
6bad70d0 T __cgoexp_637397f8f89c_unload
6b9c1500 T _unload
6bad7110 T main._cgoexpwrap_637397f8f89c_unload
6bad7590 T main.unload
```

ちゃんと`_unload`がエクスポートされてます。
やったー！

おそらく`main.unload`が Go の関数、`_unload`は cgo が出力したラッパ関数で、この`_unload`から`main.unload`が呼ばれることでGoの関数が実行されるんじゃないかな〜（このへん曖昧）。

## もうちょっと詳しく

上のコードを見て、「**GCC を MinGW のやつにしただけじゃんwww**」という Go 強者の方は以上です。
お疲れ様でした。

以下、「なんとなくわかるけどもうちょい詳しく！」というあなた（わたし）のために順を追って説明します。

Go でライブラリを作るときには **cgo** という、Go から C を呼んだり C から Go を呼んだりする機能を使います。
cgo がソースの一部を C のコードに変換、GCC でコンパイルして Go のコードとリンクすることにより、 Go で C のコードっぽいものを書くことができるようになります。

それではソースを追っていきましょう。
冒頭にいきなり大事なポイントです。

```golang
package main
```

コンパイルするにはパッケージ`main`と`main()`関数が必要です。
これはたぶん GO コードをコンパイルするときは必ず必要なんじゃないかと思ってます。

さて、パッケージ宣言の後、一番最初のコメント部分を **preamble** と呼びます。
「序文」とでも訳せましょうか、この部分に書いた C コードは cgo によって抽出されて GCC でコンパイルされるときにファイルの先頭にくっつけられます。

```golang
/* 
   #include <windows.h>
 */
```

で、その preamble の後に`import "C"`です。
これは「C パッケージをインポートして cgo 使うよ〜」って感じの宣言です（たぶん）。

ここで大事なポイント2つ目。

preamble と`import "C"`の間に**空行を入れてはいけません**！
つまり、以下のコードはダメです。

```golang
package main

/* 
   #include <windows.h>
 */

// フリーダムなオレは、ここに空行を入れちゃうぜぇ〜

import "C"
```

```sh
$ CGO_ENABLED=1 GOOS="windows" GOARCH="386" CC="i686-w64-mingw32-gcc-win32" go build -buildmode=c-archive -o libshiori.a
# command-line-arguments
./main.go:19:15: could not determine kind of name for C.BOOL
./main.go:20:12: could not determine kind of name for C.TRUE
```

怒られます。

さて、`fmt`など必要なパッケージもインポートしたら、`main()`を書いておきます。
これはもちろん`main`パッケージ内ならどこでもいいです。
中身は空で、何もしません。

やっと真打登場です。
`unload()`を書きます。
このとき、エクスポートしたい関数の直前に`//export 関数名`と書くとエクスポートされますので、書きます。

そして、大事なポイント3つ目。

`//export`の`//`と`export`の間に**空白を入れてはいけません！**

これにめっちゃハマってしまい、2時間くらい無駄にしました。
エラーは出ず、ただエクスポートされなくなるだけなので原因を特定するのがかなり厳しいです。
お気をつけ下さい。

肝心の関数ですが、C における`unload()`のプロトタイプは以下です。

```C
extern "C" __declspec(dllexport) BOOL __cdecl unload(void);
```

これを Go の関数にするとこうなります。

```golang
func unload() C.BOOL
```

C パッケージをインポートしたので、C の世界の値を使うことができます。
`C.BOOL`が C の世界の`windows.h`で宣言されている型（実際はマクロ）ですね。

型名は`C.型名`、マクロも`C.マクロ名`、関数も`C.関数()`で呼び出せます。
ポインタも`*C.型名`のようにして使えます。
ただし、`void*`は`unsafe.Pointer`ですので、`unsafe`パッケージが必要です。

で、`unload()`はとりあえず`C.TRUE`を返しておきます。
コードは以上です。

これをコンパイルしてまずは`libshiori.a`を作ります。

このとき、環境変数`CGO_ENABLED=1`と`GOOS="windows"`、`GOARCH=386`、そして`CC=MinGWのGCCコマンド`を指定します。

今回は 32bit DLLを作るため、`GOARCH=386`を指定し、MinGW の GCC は 64bit環境で 32bitプログラムにコンパイルする`i686-w64-mingw32-gcc-win32`を使います（MinGWのgccコマンド名については[kakurasanのLinux備忘録](https://kakurasan.blogspot.jp/)の「[Debian/Ubuntuでmingw-w64を用いてWindows向けのプログラムをコンパイルする](https://kakurasan.blogspot.jp/2015/07/debianubuntu-mingw-crosscompile.html)」にわかりやすい一覧があります）。

```sh
CGO_ENABLED=1 GOOS="windows" GOARCH="386" CC="i686-w64-mingw32-gcc-win32" go build -buildmode=c-archive -o libshiori.a
```

コンパイルすると`libshiori.a`と`libshiori.h`というファイルができます。
`libshiori.h`は今回、使いません。

あとは GCC で`libshiori.a`から DLL を作るだけなんですが、そのために`libshiori.a`からエクスポートしたい関数名を def ファイルに書く必要があります。

```def
LIBRARY	shiori

EXPORTS
    unload
```

`LIBRARY`にライブラリ名を書き、`EXPORTS`にエクスポートする関数名を改行区切りで列挙します。
この`EXPORTS`部分で実際に`GetProcAddress()`を使って呼び出すときの名前を決めます。
もし`//export 関数名`でエクスポートした関数名と違う関数名にしたいときは、こう書きます。

```def
LIBRARY	shiori

EXPORTS
    unload = Unload
```

この場合、Go 側で`//export Unload`した関数を DLL から呼び出すときには`unload`という名前を使うことを示します。
他にも`unload@0`とすると番号で呼び出したりできるそうですが、そこら辺は Google 先生に聞いてください。

さて、この def ファイルを`shiori.def`として GCC を叩き、DLL を作ってもらいましょう！

```sh
i686-w64-mingw32-gcc-win32 -shared -o shiori.dll shiori.def libshiori.a -Wl,--allow-multiple-definition -static -lstdc++ -lwinmm -lntdll -lws2_32
```

なんやらいろいろオプションがついてますね。

まず、cgo で使ったコンパイラと同じコンパイラを使ったほうが良いでしょう（「いや、違うのでやりたい！」というなら止めませんが……）。

そして、共有ライブラリなので`-shared`です。
出力ファイル名と先ほど作った def ファイルを指定して、Go の関数が入っている`libshiori.a`も指定します。

それから、cgo の吐くオブジェクトファイルはどうやら同じ定義とみなされるものが複数入っているようなので`-Wl,--allow-multiple-definition`をつけます（このへんよくわからないけど、mattnさんがつけてたので）。

`stdc++`や`winmm`、`ntdll`、`ws2_32`といったライブラリも使うので（preamble で`windows.h`インクルードしましたよね？）、`-static`をつけて静的にリンクしておきます。
このときそれぞれのライブラリの依存に応じて順番に書いてあげないとリンカが「ふぇぇ……シンボルが見つからないよぅ」といったエラーを出します。

ここまで成功すれば`shiori.dll`ができているはずです。

## 伺かの栞を作る

なんとなくやり方がわかったところで、栞を実装します。

### 伺かとは

伺かはデスクトップマスコットと呼ばれるアプリケーションで、デスクトップに（大抵は）かわいい女の子と謎の生物が住み着いて勝手に漫才しているのを眺めるソフトです。
私の説明が下手なので楽しくなさそうですが、めっちゃ楽しいです。
無料で利用でき、自分でキャラクターを作ることもできます。

仕組みについて超簡易的な説明をすると、「ベースウェア」と呼ばれるクライアントからイベントが飛んでくるので、それに応じて「栞」と呼ばれるサーバがキャラが話す内容や表情の画像などを返すというやり取りでできています。
キャラクターは見た目と脳に当たる部分の分離が図られており、それぞれ「シェル」と「ゴースト」と呼ばれます。
栞は「ゴースト」の根幹とも言える、人格を司る部分を担っていて、DLL で実装します。

普通はリクエストに応じて専用のスクリプトなどを解釈・実行しレスポンスを生成する DLL を C や C++ で書くことで、栞のすべてを DLL で賄うという大変な作業を回避してロジックとデータの分離を図ります。
が、この記事ではそんなこと考えず超絶シンプルな「リクエストを全部無視する、何もしない栞」を Go で書いてみたいと思います。

この記事で説明している以外の伺か関連の仕様は Google 先生に(ry

### ソース

```golang
package main

/* 
   #define UNICODE
   
   #include <windows.h>
   #include <stdlib.h>  // free()
   #include <string.h>  // strlen(), memcpy()
*//* ここに空行入れちゃダメですよ！ */
import "C"

import (
	"bytes"
	"fmt"
	"unsafe"
)

func main() {}

//export load
func load(h C.HGLOBAL, length C.long) C.BOOL {
	//
	// extern "C" __declspec(dllexport) BOOL __cdecl load(HGLOBAL h, long length);
	// 
	// h      = DLL のパス（文字列）
	// length = h のサイズ
	// 
	// h は GlobalAlloc(GPTR, length) で確保されたメモリ領域へのポインタで、DLL 側で GlobalFree(h) する必要があります。
	
    // せっかくサイズ情報があるので C.GoStringN() を使います。
    // ここは C.GoString() でも大丈夫なはず。
    // というか long -> int のキャストってどうなのよ？
    // あ、HGLOBAL は void* なので、char* に相当する *C.char にキャストしています。
	curDir := C.GoStringN((*C.char)(h), (C.int)(length))
	
	// DLL のパスが入っているメモリを開放します。
	C.GlobalFree(h)
    
    fmt.Println("[shiori] Load")
    fmt.Printf("[shiori] curDir = \"%s\"\n", curDir)
    
	return C.TRUE
}

//export unload
func unload() C.BOOL {
    //
    // extern "C" __declspec(dllexport) BOOL __cdecl unload(void);
    // 
    // 何もしません。
    
    fmt.Println("[shiori] Unload")
    return C.TRUE
}

//export request
func request(h C.HGLOBAL, length *C.long) C.HGLOBAL {
    // 
    // extern "C" __declspec(dllexport) HGLOBAL __cdecl request(HGLOBAL h, long *length);
    // 
    // h      = リクエスト（文字列）
    // length = h のサイズ（load() と違ってポインタなので注意）
    // 
    // h は GlobalAlloc(GPTR, length) で確保されたメモリ領域へのポインタで、DLL 側で GlobalFree(h) する必要があります。
    // 
    // リクエストの文字コードは Charset ヘッダを見るまでわかりませんが、ここでは簡便のため UTF-8 で来ると仮定しています。
    // 伺かベースウェアのデファクトスタンダードである SSP は UTF-8 で送ってくれるので、とりあえず、です。
    // 
    // レスポンスは h とは別に GlobalAlloc(GPTR, n) し、そこに書き込みます。
    // そして書き込んだ長さ n を length に書き込み、レスポンスが入ったメモリ領域へのポインタを返します。
    // こっちの GlobalFree() はベースウェアがしてくれます。
    // 
    // レスポンスも簡便のため一律に「204 No Content」を返しています。

    // リクエストが入っているメモリのサイズを取得します。
    // load() と違い、ポインタなので注意してください。
    req_size := (*length)

    // せっかくサイズ情報があるので C.GoStringN() を使います。
    // ここは C.GoString() でも大丈夫なはず。
    req_str := C.GoStringN((*C.char)(h), (C.int)(req_size))

    // レスポンスが入っているメモリを開放します。
    C.GlobalFree(h)

    fmt.Printf("[shiori] Request\n%s\n", req_str)

    // 正常終了だけどリクエストを無視するレスポンスを返します。
    res_str := "SHIORI/3.0 204 No Content\nCharset: UTF-8\n"

    // Go string の res_str を C で扱えるように、char の配列にします。
    // C.CString() は malloc() してメモリを確保し、そこに Go string の内容をコピーする関数です。
    res_buf := C.CString(res_str)
    
    // C.CString() で確保したメモリは自前で free() してやる必要があります。
    // この時、res_buf の型は *C.char なので unsafe.Pointer (つまり void*) にキャストします。
    // defer も使えるなんて、便利ですね。
    defer C.free((unsafe.Pointer)(res_buf))
    
    // バッファのサイズを調べます。
    // len(res_str) でもいいんですが、折角なので strlen() を呼んでみます。
    res_size := C.strlen(res_buf)
    
    // 調べたサイズを基に、レスポンス用のメモリを確保します。
    // SIZE_T は Win32 API での size_t です。
    ret := C.GlobalAlloc(C.GPTR, (C.SIZE_T)(res_size))
    
    // 確保したメモリにレスポンスをコピーします。
    // ret の型は C.HGLOBAL (つまり void*) なのですが、明示的に unsafe.Pointer にキャストしてやらねばなりません。
    // 逆に res_size は strlen() を使ったために型が C.size_t となり、キャストする必要がありません。
    C.memcpy((unsafe.Pointer)(ret), (unsafe.Pointer)(res_buf), res_size)
    
    // レスポンスのサイズを request() の第 2引数である length ポインタが指す先にキャストして書き込んでやります。
    *length = (C.long)(res_size)
    
    // レスポンスが入ったメモリ領域へのポインタ（HGLOBAL = void* です）を返して終了！
    return ret
}
```

### コンパイルと実行

毎回コマンドを手打ちするのはたるいので、コンパイル用の簡単なシェルスクリプトを書いておきます。

```sh
#!/usr/bin/sh

CGO_ENABLED=1 GOOS="windows" GOARCH="386" CC="i686-w64-mingw32-gcc-win32" go build -buildmode=c-archive -o libshiori.a

# go build が成功したら dll を作る
if [ "$?" = 0 ]; then
    i686-w64-mingw32-gcc-win32 -shared -o shiori.dll shiori.def libshiori.a -Wl,--allow-multiple-definition -static -lstdc++ -lwinmm -lntdll -lws2_32
fi
```

これを`compile.sh`とでも名付けて`chmod +x`しておけば、コンパイルは`./compile.sh`でできるようになります（Makefile は辛いので書きたくありません……）。

この DLL を実行するためには、Python や Go で呼び出しコードを書くか、[SSP](http://ssp.shillest.net/) などの伺かベースウェアをインストールする必要があります。
[SSP](http://ssp.shillest.net/) は2017年現在最も活発に開発されている伺かのベースウェアで、Wine で動かすことができます（他にも [ninix-aya](http://ninix-aya.osdn.jp/) という Wine なしで動くベースウェアもあります）。

SSP を wine で実行するには、以下のコマンドを叩きます。
このとき、適切なゴーストの栞として `shiori.dll` が読み込まれるようにしてください。

```sh
wine /path/to/ssp/installation/folder/ssp.exe
```

Wine の fixme がたくさん出てきますが、ちゃんと動きます。

なお、SHIORI/3.0 を読み書きできるありがたい Go のライブラリ「[github.com/Narazaka/shiorigo](https://github.com/Narazaka/shiorigo)」を[奈良阪某](https://narazaka.net/)さんが公開してくれていますので、本格的に栞を書くなら`go get github.com/Narazaka/shiorigo`した方がよいでしょう。

アドベントカレンダーに間に合うように Go で SHIORI を書いたゴーストを作っていますが、ネタが足りてないのでどうなることやら……

## その他ハマりポイントとか Tips とか

### Wine上でのファイルパーミッションとFAT32

Wine 上で Go の`os`パッケージを使ってファイルの読み書きをしようとすると権限がないと怒られてしまいます。
これは FAT32 にファイルパーミッションという概念がないために起こっているようです。

仕方なく直接 Win32API の CreateFile() やら WriteFile() やら CloseFile() やらを叩いたところ、ちゃんと保存できました。

### WriteFile()のエンコーディング

Windows といえば Shift_JIS (cp932) です。
Go の string は UTF-8 だそうで、そのまま安直に WriteFile() するとお化けと豆腐のエレクトリカル・パレードです。

そこで、「[go - Goで[]byteをshift-jisの文字列に変換する - スタック・オーバーフロー](https://ja.stackoverflow.com/questions/6120/goでbyteをshift-jisの文字列に変換する)」を参考に Shift_JIS に変換してから書き込んだところ、ハピネスを感じることができました。

### Go と C の橋渡し

ソースにもいくつか出てきましたが、cgo には C から Go、Go から C の世界への変換関数が用意されています。

```golang
// Go の string を malloc() で確保したメモリにコピーして C の世界でいじれる char の配列にします。
// この関数で確保したメモリは自前でfree()する必要があります。
func C.CString(string) *C.char

// Go の []byte を malloc() で確保したメモリにコピーして C の世界でいじれる配列にします。
// この関数で確保したメモリは自前でfree()する必要があります。
func C.CBytes([]byte) unsafe.Pointer

// C の世界の char 配列を Go の string に変換します。
func C.GoString(*C.char) string

// C.GoString() のサイズを指定できるバージョンです。
func C.GoStringN(*C.char, C.int) string

// C の配列を Go []byte にします。
// サイズ指定必須です。
func C.GoBytes(unsafe.Pointer, C.int) []byte
```

Go から C の世界（またはその逆）にアクセスする他の方法は、GoDoc の「[Command cgo](https://golang.org/cmd/cgo/)」にまとめられています。

### C の関数の返り値

C の関数は常に、関数の返り値とエラーという 2つの値を返します。

たとえ`void ponyo(void);`でも、2つ返ってきます。
そういうときは`_`を使いましょう。

```golang
ret, err := C.one(1)    // int one(int);
_, err := C.ponyo()
```

ただし、`C.malloc()`は Go 側でラップしているので、返り値は 1つです。
触っちゃいけないところをお触りしたらパニックを起こすようになっているとのこと。

### C の関数を定義したい！

自分で書いた C の関数を Go から呼ぶには、

 1. プロトタイプ宣言が書かれたヘッダファイルを preamble でインクルード
 2. 関数の実体を書いた`*.c`や`*.cpp`を GCC などでコンパイル
 3. Go のオブジェクトファイルと 2.をリンク

という、とてもめんどっちいやり方をしなくてはいけないようです（いやこれができるのはかなりすごいことなんだけども）。

ただ、単なるラッパ程度の簡単な関数をちょちょっと使いたいときは、`static inilne`な関数にしましょう。
これなら preamble に書いても怒られません。

### const の Go 世界での型はどうすればいいんですか？

Go の世界では`const char*`は表せません。
`*C.char`、つまり`char*`で我慢するか、どうしても必要なときは`char*`を受け取って`const char*`で関数を呼ぶラッパを書きましょう。

### struct や interface は？ union は？

「[Command cgo](https://golang.org/cmd/cgo/)」をよく読みましょう。

### go build -x

`go build`に`-x`オプションをつけると、コンパイラが何をしているかが出力されます。
つまり cgo がかなり GCC に頼っていることがわかります。

## まとめ

C の代替は Go でいいんじゃないかと思えました。
書きやすくて速くてクロスコンパイルまでできちゃうなんて、すご〜い！

みんな Go を使って新しいゴーストを書けばいいと思うよ！
……問題があるとすれば[如何か](https://github.com/Ikagaka)への移植ですが、[GopherJS](https://github.com/gopherjs/gopherjs) ならやってくれそうな気がしますし。

あと、この記事の最後の方は深夜テンションで書いてるので色々問題があったとしても許してください……
実は Go をちゃんと触るのは初めてなので、間違いとかこうした方がいいよとかあったら教えてください。

えんいー！

---

この記事は [Go Advent Calender 2017（その4）](https://qiita.com/advent-calendar/2017/go4) の 1日目の記事です。

明日は [kami_zh](https://qiita.com/kami_zh) さんによる Linux プログラミング関連の記事だそうです。
