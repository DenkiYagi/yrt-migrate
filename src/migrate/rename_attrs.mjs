// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * 属性名のリネームマイグレーション
 * @param {import('../yrt_format.js').MigratedXmlCollection} yrtDocument
 * @returns {import('../yrt_format.js').MigratedXmlCollection}
 */
export function migrate(yrtDocument) {
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
    const layouts = yrtDocument.layouts.map(xml => {
        if (!xml) return xml;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        renameAttrs(doc);
        return new XMLSerializer().serializeToString(doc.documentElement);
    });
    let style = yrtDocument.style ?? null;
    if (typeof style === "string" && style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(style, "text/xml");
        renameAttrs(styleDoc);
        style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return {
        layouts,
        style,
    };
}
