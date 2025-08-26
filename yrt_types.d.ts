/**
 * アセットオブジェクト（キー: 識別名、値: `Uint8Array`）
 */
export type AssetsObject = Partial<Record<string, Uint8Array>>;

/**
 * msgpackでデコードした直後の YRT v1.0 データのbody部分
 *
 * ※ yagisan-report-devtool リポジトリーの YrtFormat モジュールより
 */
export type DecodedYrtBody = {
    /**
     * レイアウト配列: `[name, xml][]`
     */
    l: Array<[string | null, string]>,

    /**
     * スタイルXML (nullable)
     */
    s: string | null,

    /**
     * アセット (nullable)
     */
    a: AssetsObject | null
};

/**
 * msgpackでデコードした直後の YRT v1.0 データ
 *
 * ※ yagisan-report-devtool リポジトリーの YrtFormat モジュールより
 */
export type DecodedYrt = ["YRT", 1, DecodedYrtBody];

/**
 * msgpackでデコードした直後の旧形式YRT (v1.0.0-alpha.13) のデータ
 *
 * ※ yagisan-report-devtool リポジトリーの YrtFormat モジュールより
 *
 * - `[0]`: レイアウトXMLの文字列（ルート要素: `<LayoutXml>`）
 * - `[1]`: アセットのマッピングオブジェクト
 */
export type DecodedLegacyYrt = [string] | [string, AssetsObject];
