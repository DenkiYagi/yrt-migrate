// @ts-check

/**
 * YRTに含まれるアセットのレコード
 * @typedef {Partial<Record<string, Uint8Array>>} YrtAssets
 */

/**
 * 旧形式YRT(v1.0.0-alpha.13)やXML混在データ用の構造体
 * @typedef {Object} YrtOldDocument
 * @property {string} xml - レイアウト・スタイル混在XML
 * @property {YrtAssets|null} assets - アセット（Nullable）
 */

/**
 * YRT(v1.0) レイアウト配列の要素を、内部処理用に可読性重視のレコード型で表現したもの
 * @typedef {Object} YrtLayoutEntry
 * @property {string|null} name レイアウト名（Nullable）
 * @property {string} xml レイアウトXML
 */

/**
 * YRT(v1.0) body部分のデータを、内部処理用に可読性重視の形式で表現したもの
 * @typedef {Object} YrtDocument
 * @property {Array<YrtLayoutEntry>} layouts レイアウトXML配列（1つ以上必須）
 * @property {string|null} style スタイルXML（Nullable）
 * @property {YrtAssets|null} assets アセット（Nullable）
 */

/**
 * YRT(v1.0) デコード直後のデータのbody部分
 * @typedef {Object} YrtBody
 * @property {Array<[string|null, string]>} l レイアウト配列（[name, xml]）
 * @property {string|null} s スタイルXML
 * @property {YrtAssets|null} a アセット（Nullable）
 */

/**
 * YRT(v1.0) 全体のデコード直後のデータ
 * 
 * NOTE: "Binary" と付いているが、実際にはバイナリーデータそのものではなく、そのデコード後のオブジェクトであることに注意
 * @typedef {["YRT", 1, YrtBody]} YrtBinary
 * @property {"YRT"} [0] doctype ("YRT")
 * @property {1} [1] version (1)
 * @property {YrtBody} [2] body
 */

/**
 * 旧形式YRT(v1.0.0-alpha.13)のデコード直後のデータ
 *
 * NOTE: "Binary" と付いているが、実際にはバイナリーデータそのものではなく、そのデコード後のオブジェクトであることに注意
 * @typedef {[string] | [string, YrtAssets]} LegacyYrtBinary
 * @property {string} [0] 旧形式レイアウトXMLの文字列（ルート要素: `<LayoutXml>`）
 * @property {YrtAssets|undefined} [1] アセット（Nullable）
 */

/**
 * YrtBinaryからYrtDocumentへ変換
 * @param {YrtBinary} yrtBinary
 * @returns {YrtDocument}
 */
export function yrtBinaryToDocument(yrtBinary) {
    const body = yrtBinary[2];
    if (!body || typeof body !== "object") {
        throw new Error("YRTデータのbodyが不正です");
    }
    return {
        layouts: (body.l || []).map((entry) => ({
            name: entry[0],
            xml: entry[1],
        })),
        style: body.s || null,
        assets: body.a || null,
    };
}

/**
 * YrtDocumentからYrtBinaryへ変換
 * @param {YrtDocument} doc
 * @returns {YrtBinary}
 */
export function documentToYrtBinary(doc) {
    return [
        "YRT",
        1,
        {
            l: doc.layouts.map((e) => [e.name, e.xml]),
            s: doc.style || null,
            a: doc.assets || null,
        },
    ];
}
