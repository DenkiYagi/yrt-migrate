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
 * @returns {boolean}
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
