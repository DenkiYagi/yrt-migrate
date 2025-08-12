/**
 * YRTファイルのデータ構造モデル
 * TypeScriptでなくても使えるようJSDoc型で記述
 */

/**
 * @typedef {Object} YrtLayoutEntry
 * @property {string|null} name レイアウト名（Nullable）
 * @property {string} xml レイアウトXML
 */

/**
 * @typedef {Object} YrtPackage
 * @property {Array<YrtLayoutEntry>} layouts レイアウトXML配列（1つ以上必須）
 * @property {string|null} style スタイルXML（Nullable）
 * @property {Object.<string, Uint8Array>|null} assets アセット（Nullable、なければnull）
 */

/**
 * @typedef {Object} YrtBody
 * @property {Array<[string|null, string]>} l レイアウト配列（[name, xml]）
 * @property {string|null} s スタイルXML
 * @property {Object.<string, Uint8Array>|null} a アセット
 */

/**
 * @typedef {Array} YrtRoot
 * @property {string} [0] doctype ("YRT")
 * @property {number} [1] version (1)
 * @property {YrtBody} [2] body
 */

/**
 * YrtRootからYrtPackageへ変換
 * @param {YrtRoot} yrtRoot
 * @returns {YrtPackage}
 */
export function yrtRootToPackage(yrtRoot) {
    const body = yrtRoot[2];
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
 * YrtPackageからYrtRootへ変換
 * @param {YrtPackage} pkg
 * @returns {YrtRoot}
 */
export function packageToYrtRoot(pkg) {
    return [
        "YRT",
        1,
        {
            l: pkg.layouts.map((e) => [e.name, e.xml]),
            s: pkg.style || null,
            a: pkg.assets || null,
        },
    ];
}
