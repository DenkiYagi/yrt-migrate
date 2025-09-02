// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <TableFrame>関連要素をFrame系要素にリネームする
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    const renameMap = {
        TableFrame: "Frame",
        TableHeader: "FrameHeader",
        TablePageHeader: "FramePageHeader",
        TablePageFooter: "FramePageFooter",
        TableFooter: "FrameFooter",
    };
    function rename(node) {
        if (node.nodeType === 1 && renameMap[node.nodeName]) {
            node.tagName = renameMap[node.nodeName];
            node.nodeName = renameMap[node.nodeName];
        }
        if (!node.childNodes) return;
        for (let i = 0; i < node.childNodes.length; i++) {
            rename(node.childNodes[i]);
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
