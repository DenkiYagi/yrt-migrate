// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <TableFrame>関連要素をFrame系要素にリネームする
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    /** @type {Record<string, string>} */
    const renameMap = {
        TableFrame: "Frame",
        TableHeader: "FrameHeader",
        TablePageHeader: "FramePageHeader",
        TablePageFooter: "FramePageFooter",
        TableFooter: "FrameFooter",
    };
    /**
     * @param {Element} node
     */
    function rename(node) {
        if (node.nodeType === 1 && renameMap[node.nodeName]) {
            const doc = node.ownerDocument;
            const newName = renameMap[node.nodeName];
            const newElem = doc.createElement(newName);
            // 属性コピー
            for (let j = 0; j < node.attributes.length; j++) {
                const attr = node.attributes[j];
                newElem.setAttribute(attr.name, attr.value);
            }
            // 子ノードコピー
            while (node.firstChild) {
                newElem.appendChild(node.firstChild);
            }
            // 親ノードで置換
            if (node.parentNode) {
                node.parentNode.replaceChild(newElem, node);
                node = newElem;
            } else {
                // ルート要素の場合は参照を返す（呼び出し元で再取得）
            }
        }
        if (!node.childNodes) return;
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === 1) {
                rename(/** @type {Element} */(child));
            }
        }
    }
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        if (!entry.xml) continue;
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        if (!doc || !doc.documentElement) continue;
        rename(doc.documentElement);
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }
    // Style XMLにも同様の処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        if (styleDoc && styleDoc.documentElement) {
            rename(styleDoc.documentElement);
            newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
        }
    }
    return newDoc;
}
