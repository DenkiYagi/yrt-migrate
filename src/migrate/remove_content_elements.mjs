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
    // 配列コピーしてからループ（childNodesはライブコレクション）
    const children = Array.from(node.childNodes);
    for (const child of children) {
        if (child.nodeType === 1 && TARGET_TAGS.includes(child.nodeName)) {
            // 子要素を親ノードのchildの直後（弟）に順に挿入
            let ref = child.nextSibling;
            while (child.firstChild) {
                node.insertBefore(child.firstChild, ref);
            }
            node.removeChild(child);
        }
        if (child.nodeType === 1) {
            // 再帰的に探索
            removeContentElements(/** @type {Element} */(child));
        }
    }
    // 子の展開後、親ノード全体に再帰的に適用（入れ子対応）
    // ただし、再帰の深さを制限したい場合は工夫が必要だが、ここでは単純に再帰
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
        removeContentElements(doc);
        const newXml = new XMLSerializer().serializeToString(doc.documentElement);
        return { name, xml: newXml };
    });
    const newStyle = (() => {
        const styleXml = yrtDocument.style ?? null;
        if (typeof styleXml === "string" && styleXml.trim().length > 0) {
            const styleDoc = new DOMParser().parseFromString(styleXml, "text/xml");
            removeContentElements(styleDoc);
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
