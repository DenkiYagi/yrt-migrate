// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const TARGET_TAGS = [
    "TextContent",
    "VTextContent",
    "LinkContent",
    "RichTextContent",
    "ColumnTextContent",
];

/**
 * 指定したノード配下のTARGET_TAGS要素をすべて除去し、中身だけ残す
 * @param {Element|Document} node
 */
function removeContentElements(node) {
    if (!node || !node.childNodes) return;
    const children = Array.from(node.childNodes);
    for (const child of children) {
        if (child.nodeType === 1 && TARGET_TAGS.includes(child.nodeName)) {
            const parent = node;
            const contentNodes = Array.from(child.childNodes);
            // XxxContent削除直後に親ノードの子ノードから空白TextNodeを一括削除
            for (const n of Array.from(parent.childNodes)) {
                if (n.nodeType === 3 && (n.nodeValue ?? '').replace(/\s+/g, '') === '') {
                    parent.removeChild(n);
                }
            }
            const ref = child;
            for (const n of contentNodes) {
                parent.insertBefore(n, ref);
            }
            parent.removeChild(child);
        } else if (child.nodeType === 1) {
            if ('attributes' in child) {
                removeContentElements(/** @type {Element} */(child));
            }
        }
    }
    // 再帰的に複数回出現する場合も対応
    if (Array.from(node.childNodes).some(
        n => n.nodeType === 1 && TARGET_TAGS.includes(n.nodeName)
    )) {
        removeContentElements(node);
    }
}

/**
 * マイグレーション本体（YrtDocument型のみ対応）
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument} 新しいYrtDocument
 */
export function migrate(yrtDocument) {
    const newLayouts = yrtDocument.layouts.map(({ name, xml }) => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        removeContentElements(doc.documentElement);
        const newXml = new XMLSerializer().serializeToString(doc.documentElement);
        return { name, xml: newXml };
    });
    const newStyle = (() => {
        const styleXml = yrtDocument.style ?? null;
        if (typeof styleXml === "string" && styleXml.trim().length > 0) {
            const styleDoc = new DOMParser().parseFromString(styleXml, "text/xml");
            removeContentElements(styleDoc.documentElement);
            return new XMLSerializer().serializeToString(styleDoc.documentElement);
        }
        return styleXml;
    })();

    return {
        layouts: newLayouts,
        style: newStyle,
        assets: yrtDocument.assets ?? null
    };
}
