// @ts-check

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

/**
 * XMLタイプ別のスキーマURL
 */
const SCHEMA_URLS = {
    layout: 'https://schemas.yagisan.app/2025.1/layout.xsd',
    style: 'https://schemas.yagisan.app/2025.1/style.xsd'
};

/**
 * 要素の属性リストの先頭に新しい属性を挿入する
 *
 * @param {Element} element 変更するXML要素
 * @param {Record<string, string>} newAttributes 属性名をkey、属性値をvalueとするオブジェクト
 */
function unshiftAttributes(element, newAttributes) {
    const existingAttrs = [];
    if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            existingAttrs.push({ name: attr.name, value: attr.value });
        }
    }

    while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
    }

    Object.entries(newAttributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
    });

    existingAttrs.forEach(attr => {
        element.setAttribute(attr.name, attr.value);
    });
}

/**
 * XMLルート要素にスキーマ関連の属性を追加する
 *
 * @param {string} xml XML文字列
 * @param {string} schemaUrl 追加するスキーマURL
 * @returns {string} スキーマ属性が追加された新しいXML
 */
function addSchemaToXml(xml, schemaUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    const rootElement = doc.documentElement;
    if (!rootElement || rootElement.tagName === 'parsererror') {
        throw new Error(`XML parsing error: Invalid XML format`);
    }

    // スキーマ属性を先頭に挿入
    unshiftAttributes(rootElement, {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': schemaUrl
    });

    return new XMLSerializer().serializeToString(doc);
}

/**
 * YrtRoot構造内のすべてのXMLに in-place でスキーマ属性を適用する
 *
 * @param {import('./yrt_format.js').YrtRoot} yrtRoot YRTルート構造
 * @returns {import('./yrt_format.js').YrtRoot} 変更されたYrtRoot
 */
export function migrate(yrtRoot) {
    const yrtBody = yrtRoot[2];
    const layouts = yrtBody.l;

    // すべてのレイアウトXMLにスキーマを適用
    for (let i = 0; i < layouts.length; i++) {
        layouts[i][1] = addSchemaToXml(layouts[i][1], SCHEMA_URLS.layout);
    }

    // スタイルXMLが存在する場合はスキーマを適用
    if (yrtBody.s) {
        yrtBody.s = addSchemaToXml(yrtBody.s, SCHEMA_URLS.style);
    }

    return yrtRoot;
}
