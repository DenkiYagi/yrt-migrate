// @ts-check

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const LAYOUT_ROOT_TAGS = ['LinearLayout', 'StackLayout'];
const STYLE_ROOT_TAG = 'Style';

/**
 * XMLのルートタグからファイル種別を判定する
 * @param {string} xml XML文字列
 * @returns {'layout' | 'style'} ファイル種別
 */
export function detectXmlType(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const root = doc.documentElement;
    if (!root || root.tagName === 'parsererror') {
        throw new Error('XMLパースに失敗しました。');
    }
    if (LAYOUT_ROOT_TAGS.includes(root.tagName)) {
        return 'layout';
    }
    if (root.tagName === STYLE_ROOT_TAG) {
        return 'style';
    }
    throw new Error(`未対応のルート要素です: <${root.tagName}>（対応: ${LAYOUT_ROOT_TAGS.join(', ')}, ${STYLE_ROOT_TAG}）`);
}

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
 * v1.0→v2.0マイグレーション: スキーマURLを2025.1から2026.1に更新する
 *
 * 既存のスキーマ属性がある場合は置換し、ない場合は新規追加する。
 *
 * @param {string} xml XML文字列
 * @param {'layout' | 'style'} type ファイル種別
 * @returns {string} 変換後のXML文字列
 */
export function migrateTo2026_1(xml, type) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const root = doc.documentElement;
    if (!root || root.tagName === 'parsererror') {
        throw new Error('XMLパースに失敗しました。');
    }

    // 既存のxsi属性を除去（あれば）
    if (root.hasAttribute('xmlns:xsi')) {
        root.removeAttribute('xmlns:xsi');
    }
    if (root.hasAttribute('xsi:noNamespaceSchemaLocation')) {
        root.removeAttribute('xsi:noNamespaceSchemaLocation');
    }

    // スキーマ属性を先頭に挿入
    const schemaUrl = `https://schemas.yagisan.app/2026.1/${type}.xsd`;
    unshiftAttributes(root, {
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:noNamespaceSchemaLocation': schemaUrl
    });

    return new XMLSerializer().serializeToString(doc);
}
