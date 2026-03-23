# yrt-migrate

yagisan-reports のレイアウトXMLを最新の仕様にマイグレートするためのツールです。

破壊的変更により廃止や非推奨になったコンポーネントを最新の仕様で置き換えます。

- 入力:
    - v1.0.0-alpha.13 形式のレイアウトXML（ルート要素 `<LayoutXml>` のXMLファイル）
- 出力:
    - v1.0 形式のレイアウトXML（ルート要素 `<LinearLayout>` または `<StackLayout>` のXMLファイル。レイアウト定義ごとに個別）
    - v1.0 形式のスタイルXML（ルート要素 `<Style>` のXMLファイル。変換元に `GridStyle` 等の要素が存在した場合にのみ生成）
    - 自動変換できなかった箇所に関する警告メッセージ（標準エラー出力）

## 使い方

```sh
npx github:DenkiYagi/yrt-migrate --from <schema_version> <input>
```

- `-f, --from <schema_version>`: **[必須]** マイグレーション元のスキーマバージョンを指定します。
  - `alpha13`, `2025.1` が指定可能です。
- `-o, --output <dir>`: 出力先ディレクトリーパスを指定します。
- `-d, --dry-run`: ファイルを書き出さずに変換結果を標準出力に表示します。
- `<input>`:  **[必須]** `--from alpha13` を指定した場合、XMLファイルパスを指定します。それ以外の場合は、XMLファイルパスの他にディレクトリパスも指定できます。

### ツールの動作について

- 出力先を明示指定しない場合、入力ファイルと同じディレクトリーの下に、新規ディレクトリー `<入力ファイル名>-<schema_version>` が生成されます。
- 出力先ディレクトリーに既存の `layout-*.xml` と `style.xml` が存在した場合、それらは削除されます。
- 変換完了後は `変換結果を出力しました:` とのメッセージとともに、生成したファイルの一覧が標準出力に表示されます。

### 2世代以上のマイグレーション

`--from <schema_version>` を1つずつ順に適用します。

```sh
npx github:DenkiYagi/yrt-migrate --from alpha13 path/to/input.xml 
npx github:DenkiYagi/yrt-migrate --from 2025.1 path/to/input-2025.1
```