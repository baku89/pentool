# 40th JSSST Tutorial

![](./thumb.jpeg)

> ソフトウェア科学会第 40 回大会チュートリアル  
> 「試して作って知る ライブプログラミング入門」

https://jssst2023.wordpress.com/tutorial/

触れるデモはこちら: [Live Programming Editor w/ Paper.js](https://glisp.app/jssst40-tuts/)

## 📝 NOTE

- `src`内に各ステップごとの`main.js`、`style.css`を番号つきで置いてあります。
- 最終的な完成形は `main.final.js` と `style.final.css` です。
- 細かすぎてチュートリアルですっ飛ばしたい実装は、`util.js`, `use-*.js`にまとめてあります。

## 1. 開発環境のセットアップ

```
$ git clone https://github.com/baku89/jssst40-tuts
$ cd jssst40-tuts
```

### 1.0 Vite をインストール、ボイラープレートを整理 (オプション)

このリポジトリを clone している時点で完了しているので、スキップして OK です。

```
$ npm create vite
✔ Project name: … jssst40-tuts
✔ Select a framework: › Vanilla
✔ Select a variant: › JavaScript

Scaffolding project in /Users/baku/Sites/jssst40-tuts...

$ rm -rf public counter.html javascript.svg main.js
```

```
$ vi public.html
```

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>🎨</title>
	</head>
	<body>
		<div id="preview">
			<canvas id="canvas" resize></canvas>
		</div>
		<div id="code">
			<div id="actions"></div>
			<div id="editor-wrapper">
				<div id="editor"></div>
			</div>
		</div>
		<script type="module" src="/src/main.js"></script>
	</body>
</html>
```

```
$ vi src/style.css
```

```css
:root {
	font-size: 16px;
	font-family: 'monaco', monospace;
}
```

```
$ vi src/main.js
```

```js
import './style.css'
console.log('main.js loaded')
```

### 1.1 ローカルパッケージのインストールと、開発環境の立ち上げ

```
$ npm install
$ npm run dev
```

## 2. エディタがうごくようにする

Visual Studio Code でも使われている[Monaco Editor](https://microsoft.github.io/monaco-editor/)をインストール。

```
$ npm install monaco-editor vite-plugin-monaco-editor
```

`vite.config.js` を新規作成し、以下の設定を追加。（おまじない）

```js
import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
	plugins: [
		monacoEditorPlugin.default({
			languageWorkers: ['editorWorkerService', 'typescript'],
		}),
	],
})
```

`src/style.css`をアップデート (`src/style.2.css`)

- CSS Flexbox で各ペインをレイアウトする

`src/main.js` をアップデート。（`src/main.2.js`）

- `run`関数の定義
- Monaco Editor の初期化

## 3. プレビューがうごくようにする

ベクターグラフィックス描画のバックエンドに[Paper.js](http://paperjs.org/)を用います。 Paper.js には PaperScript という JavaScript の拡張言語がバンドルされているので、それを`eval`関数のかわりに実行環境として用いることにします。

```
$npm install -D paper
```

`src/main.js` をアップデート。（`src/main.3.js`）

- 初期コードを Paper.js のものに変更
- Paper.js のコンテクストを初期化
- `run`関数内で、`paper.PaperScript.execute` を呼び出し

## 4. 全体的にこう、いい感じにする

### 4.1 コードの永続化

`src/main.js`をアップデート。（`src/main.4.1.js`）

- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)を用いて、編集したコードが自動保存されるようにする。

### 4.2 フリーズしても何とかなるようにする

マニュアルで実行するモードと、コード編集する度自動的に実行されるモードとを切り替えられるようにします。（[p5.js Web Editor](https://editor.p5js.org/)の戦略）

`index.html`に実行ボタンと自動更新チェックボックスを追加。

```html
<div id="actions">
	<button id="run">Run</button>
	<input type="checkbox" id="auto-refresh" checked />
	<label for="auto-refresh">Auto Refresh</label>
</div>
```

`src/main.js`をアップデート。（`src/main.4.2.js`）

- LocalStorage に新しく`auto-refresh`プロパティを追加。`true`にセットされている時のみ自動更新を有効とする。
- コードの実行前に一時的に `auto-refresh`を`false`にし、処理が`PaperScript.execute`から帰ってきた時点で、元の値に戻す。
  - フリーズした場合、リロード時にマニュアル実行モードとなっているため、再度フリーズすることを防ぐことができる。

### 4.3 見た目をいい感じにする

`src/main.js`をアップデート。（`src/main.4.2.js`）

- Monaco Editor の設定を細かくいじる
  - ウィンドウリサイズ時にエディタのサイズを追従させる

`src/style.css`をアップデート (`src/style.4.2.css`)

- CSS に凝ってみる
  - [Fira Code](https://github.com/tonsky/FiraCode)のプログラミングリガチャ（合字）、かわいくないですか？

## 5. 外部ツールとのコピペをサポートする

結局こしらえたツールの中だけで完結しても意味が無いので、既に使われているデザインツールとの連携を考えてみます。Paper.js は SVG のインポートとエクスポートをサポートしているので、使わない手は無いでしょう。

`index.html`に Copy・Paste ボタンを追加します。

```html
<button id="run">Run</button>
<button id="copy">Copy</button>
<button id="paste">Paste</button>
<input type="checkbox" id="auto-refresh" checked />
```

`src/main.js`に以下の記述を追加します。
細かい実装は `src/use-copy-paste-features.js` を観てもらえたら雰囲気で分かるかと思います。

```js
import useCopyPasteFeatures from './use-copy-paste-features'
useCopyPasteFeatures(editor)
```

- Copy ボタンで、現在のキャンバスの内容を SVG 形式でクリップボードにコピーする。
- Paste ボタンでクリップボードから SVG をコードに丸ごと追加。（わりと強引です）

## 6. Direct Manipulation 機能を実装する

以下の機能を追加してみます。

- 数値リテラルの値をホイールスクロールで増減
- CSS カラーを表す文字列リテラルにカラーピッカーを表示させる
- `(10, 20)`, `[1, 2]` のような 2 次元ベクトルに対応したポイントハンドルをキャンバスに表示

`index.html` にオーバーレイ UI 用の DOM を追加します。

```html
<canvas id="canvas" resize></canvas>
<div id="point-handle"></div>
```

```html
<div id="editor"></div>
<input type="color" id="color-picker" />
```

`src/main.js`に以下の記述を追加します。

```js
editor.getModel().onDidChangeContent(() => {
	//...
	updateOverlays()
})

// At the end of src/main.js
import useDirectManipulation from './use-direct-manipulation'
const { updateOverlays } = useDirectManipulation(editor)
```

## その他

`paperjs-offset`で、パスのオフセット機能を追加できます。

```
$ npm install -D paperjs-offset
```

`src/main.js`に以下の記述を追加します。

```js
import paper from 'paper'

///...

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)
```
