# yrt-migrate

yagisan-reports のレイアウト XML を最新の仕様にマイグレーションするツールです。
破壊的変更により廃止や非推奨になったコンポーネントを最新の仕様で置き換えます。

v1.0.0-alpha.13 の形式のレイアウトXML (ルート要素 `<LayoutXml>`) のみを入力として受け付けます。
出力はマイグレーション済みの `layout-*.xml` と、必要に応じて単一の `style.xml` です。

## 使い方

### インストール

```
npm install git+https://github.com/DenkiYagi/yrt-migrate.git --save-dev
```

### 実行

下記コマンドで実行します。実行後はマイグレーション済みの `layout-*.xml`（および必要に応じて `style.xml`）が出力先ディレクトリに保存されます。出力先を指定しない場合、入力ファイルと同じディレクトリに `<入力ファイル名>-v1.0` が自動生成されます。

```
npx yrt-migrate input.xml
```

主なオプション:

- `-o, --output <dir>`: 出力ディレクトリを指定します（既定では `<入力ファイル名>-v1.0`）。
- `-d, --dry-run`: ファイルを書き出さずに変換結果を標準出力に表示します。
