// @ts-check

import { DOMParser } from "@xmldom/xmldom";

/**
 * @typedef {[string] | [string, Partial<Record<string, Uint8Array>>]} DecodedLegacyYrt
 * msgpackでデコードした直後の旧形式YRT (v1.0.0-alpha.13) のデータ
 *
 * ※ yagisan-report-devtool リポジトリーの YrtFormat モジュールより
 *
 * - `[0]`: レイアウトXMLの文字列（`<LayoutXml>...</LayoutXml>`）
 * - `[1]`: アセットのマップオブジェクト（キー: 識別名、値: Uint8Array）
 */

/**
 * 指定された文字列がXMLであり、かつルート要素が `<LayoutXml>` であることを確認する
 *
 * @param {string} xml
 * @returns {boolean}
 */
export function isLegacyLayoutXml(xml) {
    try {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        if (!doc || !doc.documentElement) return false;
        return doc.documentElement.nodeName === 'LayoutXml';
    } catch (e) {
        return false;
    }
}

/**
 * 旧YRT形式 (v1.0.0-alpha.13) かどうかを判定する
 * 
 * - `decoded` のデータ型が `DecodedLegacyYrt` に合致すること
 * - レイアウトXMLが旧形式であること
 * 
 * @param {unknown} decoded
 * @returns {decoded is DecodedLegacyYrt}
 */
export function isLegacyYrtFormat(decoded) {
    if (!Array.isArray(decoded)) return false;

    if (decoded.length === 1) {
        const [maybeXml] = decoded;
        if (typeof maybeXml !== 'string') return false;
        return isLegacyLayoutXml(maybeXml);
    } else if (decoded.length === 2) {
        const [maybeXml, maybeAssets] = decoded;
        if (typeof maybeXml !== 'string') return false;
        if (maybeAssets == null || typeof maybeAssets !== 'object') return false;
        return isLegacyLayoutXml(maybeXml);
    } else {
        return false;
    }
}

/**
 * 有効なアセット（プロパティーの値がすべて `Uint8Array` であるようなオブジェクト）であることを確認する
 * 
 * ※ アセットオブジェクトの形式は v1.0.0-alpha.13 と v1.0 で共通
 * 
 * @param {unknown} value
 * @returns {value is Partial<Record<string, Uint8Array>>}
 */
export function isAssetsObject(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    if (value instanceof Map || value instanceof Set) return false; // 発生しない想定であるが一応判定
    for (const v of Object.values(value)) {
        if (!(v instanceof Uint8Array)) return false;
    }

    return true;
}

/**
 * YRTが新フォーマット（マイグレーション済み）かどうか判定
 * - `['YRT', 1, { l: [...], ... }]` 形式であること
 * - `l` 配列の要素が1つ以上存在すること
 *
 * @param {unknown} maybeYrt
 * @returns {boolean}
 */
export function isAlreadyMigrated(maybeYrt) {
    if (!Array.isArray(maybeYrt) || maybeYrt.length < 3) return false;
    if (maybeYrt[0] !== 'YRT' || maybeYrt[1] !== 1) return false;
    const body = maybeYrt[2];
    if (!body || typeof body !== 'object') return false;
    if (!Array.isArray(body.l) || body.l.length === 0) return false;

    return true;
}
