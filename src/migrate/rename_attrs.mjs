// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * 属性名のリネームマイグレーション
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    const newDoc = structuredClone(yrtDocument);
    /**
     * @param {Document} doc
     */
    function renameAttrs(doc) {
        // Table要素のpageBreakCondition→breakCondition
        const tables = doc.getElementsByTagName("Table");
        for (let j = 0; j < tables.length; j++) {
            const el = tables[j];
            if (el.hasAttribute("pageBreakCondition")) {
                const val = el.getAttribute("pageBreakCondition");
                if (val !== null) el.setAttribute("breakCondition", val);
                el.removeAttribute("pageBreakCondition");
            }
        }
        // Grid要素のborderRadius→outerBorderRadius
        const grids = doc.getElementsByTagName("Grid");
        for (let j = 0; j < grids.length; j++) {
            const el = grids[j];
            if (el.hasAttribute("borderRadius")) {
                const val = el.getAttribute("borderRadius");
                if (val !== null) el.setAttribute("outerBorderRadius", val);
                el.removeAttribute("borderRadius");
            }
        }
    }
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        if (!entry.xml) continue;
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        renameAttrs(doc);
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }
    // Style XMLにも同様の処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        renameAttrs(styleDoc);
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return newDoc;
}
