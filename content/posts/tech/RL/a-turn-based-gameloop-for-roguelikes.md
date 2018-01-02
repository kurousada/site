+++

title       = "ローグライクのターン制ゲームループ"
type        = "post"
author      = "Kuro Usada"
categories  = ["tech", "RL", "python", "js"]
date        = "2018-01-02T23:19:16+09:00"
description = "A turn based gameloop for roguelikes."
draft       = false
toc         = true

featured              = true
featuredtitle         = "変愚蛮怒"
featuredlocation      = "http://hengband.osdn.jp/"
featuredcopyright     = "Hengband Dev Team"

+++

新年あけましておめでとうございます。
本当はクリスマスに Roguelike をリリースしたかったんですが色々あって大幅に遅れ、いつの間にか新年になってました。
完成まで待つといつになるかわからないので、ソース以外の日本語情報が少ないターン制ゲームループの実装について書きます。
ブラウザでもデスクトップでも大丈夫です。

<!--more-->

~~パク~~ 参考にしたのは「[Game Programming Patterns](http://gameprogrammingpatterns.com/)」という本と、その著者 Bob Nystrom さんのブログ記事である「[A Turn-Based Game Loop](http://journal.stuffwithstuff.com/2014/07/15/a-turn-based-game-loop/)」です。
Nystrom さんの本やブログは必見の価値有りです（本も Web で全文公開されています）。
なんならこの記事読まなくても参考元の記事を読めば書けます。

## Roguelike とはどんな食べ物なのか

**食べ物ではありません。**

コンピュータゲームの一種で、ジャンルは RPG に属します。
元々は Unix 向けのコンソールゲームである「Rogue（ローグ）」が持つ特徴を備えた「Rogue-like Games（ローグのようなゲーム）」の総称であり、ジャンル名とも言えます。

Rogue には、以下のような特徴があります。

 - 剣と魔法の世界のシングルプレイヤー RPG である。
 - リアルタイムではなくターン制で、キャラクタのスピードによって行動順が割り当てられる。
 - ダンジョンを徘徊しながら階段を見つけてひたすら下っていくゲームで、各階のマップは毎回自動で生成される。
 - セーブはゲーム中断のためにしか用意されておらず、一度死んだらキャラの作成からやり直し。
 - アイテムの多くは未鑑定状態で、鑑定して初めてどんなアイテムかわかる。
 - 食料を食べられず空腹になると死ぬ。
 - キーボードで操作し、キーの一つ一つに行動が割り当てられている。
 - コンソールゲームだが、Curses ライブラリを使ってグラフィカルな表現に近い UI を持つ。
 - マップでは ASCII 文字がプレイヤーや通路、壁、アイテム、モンスターなどを表す（下図）。

```
                              ------------
                              |.....!....|
                              |..@.......|
            ##################+.........:|
            #                 |...%.H....|
            #                 ------+-----
            #
         ---+---
         |.....|
         |.?...|
         |.....+######        ---------+----
         -------     #        |............|
                     #        |............+
                     #########+..........^.|
                              |............|
                              --------------
```

しかしこの Rogue が大変おもしろかったため、「[NetHack](https://www.nethack.org/)」や「[Angband](http://rephial.org/)」など色々な亜種が生まれ、Roguelike と名乗るゲームが数多くできました。
元になった Rogue は様々な特徴を持っていたので、どんなゲームが Roguelike なのかという定義については議論の余地があります。
詳しくは「[ローグライクの定義まとめ – 2dgames.jp](http://2dgames.jp/2015/03/19/roguelike/)」を参照してください。

一言で言うと「やったことないなら、やってください」です。

## ゲームループの実装方針

「こんな感じにしたいけど、設計はどうすればいいんだろう……」と悩んでたら上述の記事にまさにその通りな設計が書いてありました。

### スピードの概念があるターン制

ただのターン制では、プレイヤーが 1歩動くとモンスターも 1歩動きます。
例外なく同じ順序で、誰もが同じスピードです。

しかしこれではつまらないので、スピードの概念を導入します。
スピードが早いキャラクターほど多くの行動を取ることができ、プレイヤーが 1歩動く→モンスターが 2歩動く→プレイヤーが 1歩動く→モンスターが 3歩動く、といった感じになります。

### プレイヤーと NPC は同じように扱う

Roguelike、特に私が大好きな「[Elona](http://ylvania.org/jp/elona)」は超自由度が高いゲームです（Elona についてはまた今度書きます）。
「ゼルダの伝説 ブレス オブ ザ ワイルド」よりもできることが多いんじゃないかというぐらいの自由度です（ゼルダはプレイしたことないです）。

薬を飲んだり杖を振ったりといった行動をプレイヤーと NPC で共通化できれば、労力が少なくてすむはずです。

### ロジックと UI の分離

今回作っているローグライクは、コンソールベースではなく Elona のような GUI にしたいと考えていました。
しかし昔ながらのコンソールも捨てがたいし……というわけで、ロジックと UI を分離します。

コンソールベースの UI は「curses」や「BearLibTerminal」、GUI ライブラリは「SDL」「SFML」「OpenGL」などいくらでもあり、選択に迷います。
ロジックと UI を分離することで、UI 部分が依存する GUI ライブラリのメンテナンスが止まっても移植する労力が少なくて済みます。

また、毎年「7DRL」という、7日間で Roguelike を作るというイベントがあるのですが、ロジックと UI を分離してライブラリにしておけばより簡単に作ることができます。

### NPC の AI は差し替え可能にする

NPC の行動戦略を決定する AI は差し替え可能にしたいです。
NPC をペットとして動かすことができるようにしたいのですが、その時に行動戦略も指示することができると楽しいです。

## よくあるゲームループ

今書いているのが Python 3.6 なので、サンプルは Python 3.6 で書きます（実際のコードとは異なります）。

さて、まずはよくあるゲームループを見てみましょう。
これを基にどんどん書き換えていきます。

なお、ブラウザの話は少し特殊なので、もう少し先で出てきます。

```python
class Actor:
    def update(self):
        pass
    def draw(self):
        pass

class Game:
    def __init__(self, actors = []):
        self.actors  = actors
        self.running = False
    def run(self):
        self.running = True
        while self.running:
            self.handle_input()
            self.update()
            self.draw()
    def quit(self):
        self.running = False
    def update(self):
        for actor in self.actors:
            actor.update()
    def draw(self):
        for actor in self.actors:
            actor.draw()

if __name__ == '__main__':
    game = Game()
    game.run()
```

このゲームループではゲームのロジックと UI の分離があまりなされていません。
`Actor` クラスがゲームロジックも描画も司っています。

そこで、`Actor` クラスを `Actor` と `Sprite` に分け、`Game` クラスからゲームロジックを担当する `World` クラスを切り出します。
そしてこの `World` クラスを `Game` クラスが持つようにし、UI から `World` の更新を進めるようにします。

```python
class Sprite:
    def __init__(self, actor):
        self.actor = actor
    def draw(self):
        pass

class Actor:
    def update(self):
        pass

class Game:
    def __init__(self, world=None):
        self.world   = world or World()
        self.sprites = {}
        self.running = False
    def run(self):
        self.running = True
        while self.running:
            self.handle_input()
            self.update()
            self.draw()
    def quit(self):
        self.running = False
    def update(self):
        self.world.update()
    def draw(self):
        for actor in self.world.actors:
            sprite = Sprite(actor)
            sprite.draw()

class World:
    def __init__(self, actors=[]):
        self.actors = actors
    def update(self):
        for actor in self.actors:
            actor.update()

if __name__ == '__main__':
    game = Game()
    game.run()
```

## 更新と描画を非同期っぽくする

`World.update()` ではすべての actor を一度に処理していました。
しかし、actor が増えて更新処理が遅れると描画処理にも遅れが生じ、非常に嫌なことになります。

そこで、更新処理をより細かいステップにして、一定の時間が経つまでできるだけ呼び出した後、描画処理を呼び出すことにしましょう。

コードは全部書いていくと長いので、前のコードと同じ所は省略します。

```python
import time

class Game:
    MS_PER_UPDATE = 50
    def __init__(self, world=None):
        self.world     = world or World()
        self.running   = False
        self._previous = time.time()
        self._lag      = 0.0
    def run(self):
        self.running = True
        while self.running:
            # 前回の描画からの経過時間を得る
            current        = time.time()
            elapsed        = current - self._previous
            self._previous = current
            self._lag     += elapsed
            
            # 一定時間経つまで何度か更新する
            while lag >= self.MS_PER_UPDATE:
                self.handle_input()
                self.update()
                self._lag -= self.MS_PER_UPDATE
            
            # 一定時間経ったら描画処理
            self.draw(self._lag / self.MS_PER_UPDATE)

class World:
    def __init__(self, actors=[]):
        self.actors         = actors
        self._current_actor = 0
    def update(self):
        if self.actors:
            # 1つの actor だけ処理する
            actor = self.actors[self._current_actor]
            actor.update()
            self._current_actor = (self._current_actor + 1) % len(self.actors)
```

これで更新処理と描画処理が非同期っぽくなり、更新処理の方はできるだけ多く呼ばれつつ、一定時間ごとに描画処理が呼ばれるようになりました。
なお、描画関数に引数が渡されているのは更新が途中でも描画関数が呼び出されるためで、この引数「補間（interpolation）」を基にして各オブジェクトの位置を決めたりします。
詳しくは「[Game Loop - Sequencing Petterns - Game Programming Patterns](http://gameprogrammingpatterns.com/gameloop.html)」にてわかりやすい絵付きで説明されています。
アニメーションとかしないタイプの Roguelike なら「補間」は無視しても構いません。

## 行動を抽象化する

`Actor.update()` でそれぞれの actor 専用の行動を延々と書いていってもいいのですが、actor ができる行動の多くはどの actor にも共通ですので抽象化します。

ゲーム内での行動を抽象化した `Action` クラスを用意し、`Actor` に次の行動を問い合わせるように変更しました。
あと、actor の管理も別のクラスに分けて抽象化しておきます。

```python
from abc import *
from collections import deque

class Queue(deque):
    """現在のアイテムを覚えていることができるキュー"""
    @property
    def current(self):
        """
        現在のアイテム
        リストが空なら None を返す。
        """
        return self[0] if self else None
    def proceed(self, n=1):
        """次のアイテムへ進める"""
        self.rotate(-n)

class World:
    def __init__(self, actors=[]):
        self.actors = Queue(actors)
    def update(self):
        world = self
        
        # actor を得る
        actor = world.actors.current
        if not actor:
            return
        
        # actor に次の行動を問い合わせる
        action = actor.get_next_action(world)
        if not action:
            return
        
        # action を実行する
        action.perform(actor, world)
        
        # 次の actor へ進める
        world.actors.proceed()

class Actor:
    def get_next_action(self, world):
        return None # 状況に応じて何かの Action（か None）を返す

class Action(ABC):
    @abstractmethod
    def perform(self, actor, world):
        raise NotImplementedError("Abstract base class 'Action' must be inherited.")
```

`Action` は抽象基底クラスなので、継承して `perform` の実装をそれぞれの Action に応じて書く必要があります。

これで様々な `Action` を好きな `Actor` にさせることができます。

## AI も抽象化して差し替え可能に

`Actor.get_next_action()` に actor ごとの行動戦略を実装していけば AI の実装はできますが、それでは同じコードを何度もコピペしそうな嫌な予感がします。

そこで、AI を抽象化した `Brain` クラスを用意して、そこに AI の実装を詰め込みます。
そして、`Brain.decide_next_action()` が呼ばれたら与えられた actor の action キューに `Action` を積むようにします。
`Actor.get_next_action()` はお役御免です。

メソッド名を変えたのは、`Brain.decide_next_action()` が直接 `Action` を返すのではなくキューに積むためです。
こうすることでいくつかの `Action` を一連の行動としてキューに追加することができます。

また、プレイヤーの AI 用に `DummyBrain` という、何も `Action` を積まないものも定義しています。

```python
class Actor:
    def __init__(self, brain=None, actions=[]):
        self.brain   = brain or DummyBrain()
        self.actions = Queue(actions)

class Brain(ABC):
    @abstractmethod
    def decide_next_action(self, actor, world):
        raise NotImplementedError("Abstract base class 'Brain' must be inherited.")

class DummyBrain(Brain):
    def decide_next_action(self, actor, world):
        pass
```

`World.update()` では `Actor.get_next_action()` ではなく actor の `Brain.decide_next_action()` を呼ぶようにします。
この際、キューに `Action` が無いときだけ呼び出すようにしています。

```python
class World:
    def __init__(self, actors=[]):
        self.actors = Queue(actors)
    def update(self):
        world = self
        
        # actor を得る
        actor = world.actors.current
        if not actor:
            return
        
        # action を得る
        action = actor.actions.current
        if not action:
            # actor に次の行動を問い合わせる
            actor.brain.decide_next_action(actor, world)
            action = actor.actions.current
            if not action:
                return
        
        # action を実行する
        action.perform(actor, world)
        
        # 次の action へ進める
        actor.actions.proceed()
        
        # 次の actor へ進める
        world.actors.proceed()
```

これで様々な AI を好きな `Actor` にさせることができます。

## プレイヤーの入力を actor に注入する

ここまで、プレイヤーと NPC は同じように扱ってきました。
しかし、プレイヤーは AI の代わりにキーボードやマウス、ジョイパッドなどからの入力で動きます。

これを実現するためにやるべきことは、プレイヤーの入力を `Action` に変換して actor に注入（injection）することです。

プレイヤーの入力を注入する actor を覚えておくために、`World.player` プロパティを定義します。
`World.player` は `World.actors` にも登録されるため、更新処理部分は全く手をつけなくて構いません。

```python
class World:
    def __init__(self, player=None, actors=[]):
        self.actors = Queue(actors)
        self.player = player
    @property
    def player(self):
        return self.__player__
    @player.setter
    def player(self, player):
        if player not in self.actors:
            self.actors.append(player)
        self.__player__ = player
```

そして、プレイヤーの入力を基に `Action` を `World.player` の action キューに追加します。
ここではノン・ブロッキング IO のために curses を使っています。

```python
import time
import curses

class Game:
    def __init__(self, stdscr, world=None):
        self.stdscr    = stdscr
        self.world     = world or World()
        self.running   = False
        self._previous = time.time()
        self._lag      = 0.0
    def handle_input(self):
        player = self.world.player
        
        # プレイヤーの番なら
        if self.world.actors.current == player:
            key = self.stdscr.getkey()
            
            # 入力を基に Action をプレイヤーに注入
            if key == curses.KEY_UP:
                action = WalkAction(Direction.North)
                player.actions.append(action)
            elif key == 'q':
                self.quit()

def main(stdscr):
    world = World(player=Actor())
    Game(stdscr, world=world).run()

if __name__ == '__main__':
    curses.wrapper(main)
```

## メインループを勝手に弄れないとき

ブラウザや一般的な GUI ライブラリでは、メインループはブラウザやライブラリ側が管理していて、アプリケーション側で定義することができないことが多々あります。
そんなときは、アプリケーション側のメインループを別に定義して、入力があれば `Action` を actor に注入します。

ブラウザの場合は `window.setInterval()` や `window.setTimeuot()` を使います。
`async` / `await` を使って同期っぽく書くこともできますが、折角タイマーが用意されているのですから利用させてもらったほうがいいでしょう。

ここのコードだけは ES 2017 です。

```js
class Keyboard {
    /* キーボードイベントを監視して、キーボードの状態を確認しやすくするクラスです。
     * キーが押されていれば、Keyboard.keys.キー名 に KeyboardEvent オブジェクトが入ります。
     */
    constructor(window) {
        this.window     = window
        this.keys       = {}
    }
    start() {
        this.window.addEventListener('keyup', this.on_keyup)
        this.window.addEventListener('keydown', this.on_keydown)
    }
    stop() {
        this.window.removeEventListener('keyup', this.on_keyup)
        this.window.removeEventListener('keydown', this.on_keydown)
    }
    on_keyup(event) {
        this.keys[event.key] = null
    }
    on_keydown(event) {
        this.keys[event.key] = event
    }
}

class Game {
    MS_PER_HANDLE_INPUT = 100
    MS_PER_UPDATE = 10
    MS_PER_DRAW = 100
    constructor(window, world=null) {
        this.window       = window
        this.world        = world || new World()
        this.keyboard     = Keyboard(this.window)
        this.input_timer  = null
        this.update_timer = null
        this.draw_timer   = null
        this.running      = false
    }
    run() {
        this.running      = true
        this.keyboard.start()
        this.input_timer  = this.window.setInterval(this.handle_input, this.MS_PER_HANDLE_INPUT)
        this.update_timer = this.window.setInterval(this.update, this.MS_PER_UPDATE)
        this.draw_timer   = this.window.setInterval(this.draw, this.MS_PER_DRAW)
    }
    quit() {
        this.running      = false
        this.keyboard.stop()
        this.window.clearInterval(this.input_timer)
        this.window.clearInterval(this.update_timer)
        this.window.clearInterval(this.draw_timer)
        this.input_timer  = null
        this.update_timer = null
        this.draw_timer   = null
    }
    handle_input() {
        if (self.keyboard.keys.ArrowUp) {
            action = WalkAction(Direction.North)
            this.world.player.actions.push(action)
        }
    }
}

function main(window) {
    const game = new Game(window)
    game.run()
}

;(function(window){
    main(window)
})(window);
```

「pyglet」なら `pyglet.clock.schedule_interval()` が使えます。
他のライブラリでも同じような仕組みがあると思います。

## ターン制ゲームにおけるスピードの実装

さて、ここまでは「完全な」ターン制でしたが、あまりに完全なためにすべての actor が同じスピードで動いていました。
これではつまらないので Angband の Energy を使った実装を参考に、actor ごとに異なるスピードを持てるようにします。

まず、`Actor.speed` と `Actor.energy` を定義します。
`Actor` は各ターンごとにスピードに応じた量の Energy を得て、一定量以上の Energy が貯まれば行動できるようになります。

移動できない方向へ移動しようとしたときなどに Energy を消費しないよう、`Action.perform()` は成功したかどうかを返すように変更します。

```python
class Actor:
    def __init__(self, brain=None, speed=50, actions=[]):
        self.brain   = brain or DummyBrain()
        self.speed   = speed
        self.energy  = 0
        self.actions = Queue(actions)

class World:
    ENERGY_COST = 100
    def __init__(self, actors=[]):
        self.actors = Queue(actors)
    def update(self):
        world = self
        
        # actor を得る
        actor = world.actors.current
        if not actor:
            return
        
        # action を得る
        action = actor.actions.current
        if not action:
            # actor に次の行動を問い合わせる
            actor.brain.decide_next_action(actor, world)
            action = actor.actions.current
            if not action:
                return
        
        # actor に energy を与える
        actor.energy += world.calc_energy(actor.speed)
        
        # 十分 energy があるなら行動可能
        if actor.energy >= self.ENERGY_COST:
            # action を実行する
            succeeded = action.perform(actor, world)
            
            if succeeded:
                # energy を消費する
                actor.energy -= self.ENERGY_COST
            
            # 次の action へ進める
            actor.actions.proceed()
        
        # 次の actor へ進める
        world.actors.proceed()
    def calc_energy(self, speed):
        return math.floor(math.erf(speed / 1000) * 1000)
```

`Actor.speed` から 1ターンごとに得られる Energy を計算するのに誤差関数を使っています。
誤差関数が何を意味する関数なのかは正直良く知りませんが、そのグラフの形は理想的です。
ただ、重そうな処理なので Angband のように予めテーブルを定義する方式の方がいいのかもしれません。

{{< fig-quote path="https://upload.wikimedia.org/wikipedia/commons/2/2f" file="Error_Function.svg" title="誤差関数のグラフ" link="https://commons.wikimedia.org/wiki/File:Error_Function.svg" author="誤差関数 - Wikipedia" authorlink="https://ja.wikipedia.org/wiki/誤差関数" >}}

## Action をもっと柔軟に

例えば、右キーを押したらプレイヤーが右に歩くとします。
しかしその方向に扉があったら右に歩くのではなく扉を開けてほしいですし、その方向に他の actor がいたら会話したり攻撃したりしてほしいです。

これを実現するために `Action.perform()` の返り値として成功の可否だけでなく、代わりに実行すべきアクションも返すようにします。
また、複数ターンに渡って 1つの `Action` を実行できるように、実行が終了したかどうかも返すようにします。

```python
from typing import NamedTuple, Optional

class ActionResult(NamedTuple):
    succeeded  : bool               = True
    done       : bool               = True
    alternative: Optional['Action'] = None
```

あとは `ActionResult.alternative` が `None` になるまで `Action` を実行したりなんだりかんだりします。

```python
class World:
    def update(self):
        world = self
        
        # actor を得る
        actor = world.actors.current
        if not actor:
            return
        
        # action を得る
        action = actor.actions.current
        if not action:
            # actor に次の行動を問い合わせる
            actor.brain.decide_next_action(actor, world)
            action = actor.actions.current
            if not action:
                return
        
        # actor に energy を与える
        actor.energy += world.calc_energy(actor.speed)
        
        # 十分 energy があるなら行動可能
        if actor.energy >= self.ENERGY_COST:
            # action を実行する
            while action:
                result = action.perform(actor, world)
                action = result.alternative
            
            if result.succeeded:
                # energy を消費する
                actor.energy -= self.ENERGY_COST
            
            if result.done:
                # 次の action へ進める
                actor.actions.proceed()
        
        # 次の actor へ進める
        world.actors.proceed()
```

「歩く」という行動を表す `WalkAction` はこんな感じになります。

```python
class WalkAction(Action):
    def __init__(self, direction):
        super.__init__()
        self.direction = direction
    def perform(self, action, world):
        from_position = action.position
        difference    = Direction.to_difference(self.direction)
        to_position   = from_position + difference
        
        # actor が direction を向くようにする
        actor.face = self.direction
        
        # to_position に actor がいるか確認する
        neighbors = [actor for actor in world.actors if actor.position == to_position]
        if neighbors:
            # いれば攻撃
            return ActionResult(succeeded=False, done=False, alternative=AttackAction(targets=neighbors))
        
        # to_position に 閉じた扉があるか確認する
        doors = [tile for tile in world.fields.current.get_at(to_position) if isinstance(tile, DoorTile) and tile.closed]
        if doors:
            # あれば開く
            return ActionResult(succeeded=False, done=False, alternative=OpenDoorAction(doors=doors))
        
        # to_position に移動できるか（壁がないかなど）確認する
        if not world.fields.current.movable_to(self.direction, to_position):
            return ActionResult(succeeded=False)
        
        # 移動する
        actor.position = to_position
        
        return ActionReult(succeeded=True)
```

## まとめ

本当は昨日公開するはずでしたが、こたつに「ねぇねぇ、いっしょにいようよぉ」とせがまれてしまい、こんなに時間がかかってしまいました。
サンプルコードは実際のコードベースから抜き出して型アノテーションをなくしたりわかりやすくなるように手直ししたものなので、動かなかったらうまくがんばってください。

Go で書こうとしたものの、いいグラフィックライブラリが見つからず Python 3.6 + pyglet 1.3 で書いています。
でも SFML の Go バインディングがあることに気づいたので書きなおそうか迷っています。
今更デスクトップゲームは流行らないかもしれないし、将来的にはブラウザでも動くようにしたいんですけども、まあとりあえず。
