# yrt-migrate

yagisan-reports のレイアウトXMLを最新の仕様にマイグレートするためのツールです。
破壊的変更により廃止や非推奨になったコンポーネントを最新の仕様で置き換えます。
自動変換できないケースに対しては警告メッセージを表示します。

- 入力:
    - v1.0.0-alpha.13 形式のレイアウトXML（ルート要素 `<LayoutXml>`）
- 出力:
    - v1.0 形式のレイアウトXML（ルート要素 `<LinearLayout>` または `<StackLayout>`。レイアウトごとに個別のXMLファイル）
    - v1.0 形式のスタイルXML（ルート要素 `<Style>`。変換元に `GridStyle` 等のスタイル系要素が存在した場合にのみ生成）

## 使い方

### インストール

```sh
npm install git+https://github.com/DenkiYagi/yrt-migrate.git --save-dev
```

### 実行

```sh
npx yrt-migrate path/to/input.xml
```

- 出力先を明示指定しない場合、入力ファイルと同じディレクトリーの下に、新規ディレクトリー `<入力ファイル名>-v1.0` が生成されます。
- 出力先ディレクトリーに既存の `layout-*.xml` と `style.xml` が存在した場合、それらは削除されます。

主なオプション:

- `-o, --output <dir>`: 出力先ディレクトリーパスを指定します。
- `-d, --dry-run`: ファイルを書き出さずに変換結果を標準出力に表示します。
