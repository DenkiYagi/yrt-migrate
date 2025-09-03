// @ts-check

/**
 * 旧YRT(alpha.13以前)やXML混在データ用の構造体
 * @typedef {Object} YrtOldDocument
 * @property {string} xml - レイアウト・スタイル混在XML
 * @property {Partial<Record<string, Uint8Array>>|null} assets - アセット（Nullable）
 */

/**
 * @typedef {Object} YrtLayoutEntry
 * @property {string|null} name レイアウト名（Nullable）
 * @property {string} xml レイアウトXML
 */

/**
 * @typedef {Object} YrtDocument
 * @property {Array<YrtLayoutEntry>} layouts レイアウトXML配列（1つ以上必須）
 * @property {string|null} style スタイルXML（Nullable）
 * @property {Partial<Record<string, Uint8Array>>|null} assets アセット（Nullable）
 */

/**
 * @typedef {Object} YrtBody
 * @property {Array<[string|null, string]>} l レイアウト配列（[name, xml]）
 * @property {string|null} s スタイルXML
 * @property {Partial<Record<string, Uint8Array>>|null} a アセット（Nullable）
 */

/**
 * @typedef {Array} YrtBinary
 * @property {string} [0] doctype ("YRT")
 * @property {number} [1] version (1)
 * @property {YrtBody} [2] body
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
