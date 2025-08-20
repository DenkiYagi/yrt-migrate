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
    a: { [key: string]: Uint8Array } | null
};

/**
 * msgpackでデコードした直後の YRT v1.0 データ
 *
 * ※ yagisan-report-devtool リポジトリーの YrtFormat モジュールより
 */
export type DecodedYrt = ["YRT", 1, DecodedYrtBody];
