# yrt-migrate
yagisan-reportsのレイアウトXMLを最新の仕様にマイグレーションするツールです。
破壊的変更により廃止や非推奨になったコンポーネントを最新の仕様で置き換えます。

パッケージされたテンプレートファイル(.yrt)と、レイアウトXML(.xml)に対応しています。

## 使い方

### インストール

```
npm install git+https://github.com/DenkiYagi/yrt-migrate.git --save-dev
```

### 実行

下記コマンドで実行します。実行後はマイグレーションの結果でファイルが更新されて、バックアップファイルが作成されます。

```
npx yrt-migrate input.xml
```
