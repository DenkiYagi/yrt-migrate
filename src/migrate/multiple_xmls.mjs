// @ts-check

import xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * <LayoutXml>要素を削除し、1XML1レイアウト化するマイグレーション
 * @param {import('../yrt_format.js').YrtOldDocument} oldDoc - 旧YRT（alpha.13以前）
 * @returns {import('../yrt_format.js').YrtDocument} - 分割・抽出済みの新YRTドキュメント
 */
export function migrate(oldDoc) {
    // 入力はYrtOldDocument: { xml, assets }
    const xml = oldDoc.xml;
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    let layoutXmlElements = xpath.select("//LayoutXml", doc);
    if (!Array.isArray(layoutXmlElements)) layoutXmlElements = [];

    /** @type {{ name: string | null, xml: string }[]} */
    const newLayouts = [];
    layoutXmlElements.forEach(layoutXmlElement => {
        // LayoutXml直下の LinearLayout または StackLayout を取得
        let layoutChildren = xpath.select("LinearLayout | StackLayout", layoutXmlElement);
        if (!Array.isArray(layoutChildren)) layoutChildren = [];
        layoutChildren.forEach(layoutChild => {
            // 各レイアウトを個別のXMLとして作成
            const newDoc = doc.implementation.createDocument(null, null, null);
            const clonedLayout = layoutChild.cloneNode(true);
            newDoc.appendChild(clonedLayout);
            const serializer = new XMLSerializer();
            const layoutXml = serializer.serializeToString(newDoc);
            newLayouts.push({ name: null, xml: layoutXml });
        });
    });

    // layouts配列を上書き
    let layouts;
    if (newLayouts.length > 0) {
        layouts = newLayouts;
    } else {
        // LayoutBody 必須化については後続ステップで対応
        layouts = [{ name: null, xml: "<LinearLayout></LinearLayout>" }];
    }

    const filteredAssets = oldDoc.assets
        ? Object.fromEntries(
            Object.entries(oldDoc.assets)
                .filter(([_, v]) => v != null)
                .map(([k, v]) => [k, /** @type {Uint8Array} */ (v)])
        )
        : null;

    return {
        layouts,
        style: null,
        assets: filteredAssets && Object.keys(filteredAssets).length > 0 ? filteredAssets : null,
    };
}
