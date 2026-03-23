// @ts-check

import xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * <LayoutXml>要素を削除し、1XML1レイアウト化するマイグレーション
 * @param {import('./yrt_format.js').LegacyLayoutDocument} oldDoc レガシーXML入力
 * @returns {import('./yrt_format.js').MigratedXmlCollection} 分割・抽出済みのXMLコレクション
 */
export function migrate(oldDoc) {
    // 入力はLegacyLayoutDocument: { xml }
    const xml = oldDoc.xml;
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    let layoutXmlElements = xpath.select("//LayoutXml", doc);
    if (!Array.isArray(layoutXmlElements)) layoutXmlElements = [];

    /** @type {string[]} */
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
            newLayouts.push(layoutXml);
        });
    });

    // layouts配列を上書き
    let layouts;
    if (newLayouts.length > 0) {
        layouts = newLayouts;
    } else {
        // LayoutBody 必須化については後続ステップで対応
        layouts = ["<LinearLayout></LinearLayout>"];
    }

    return {
        layouts,
        style: null,
    };
}
