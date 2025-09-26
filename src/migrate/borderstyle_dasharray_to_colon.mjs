// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * borderStyle属性 dasharray()→コロン区切り変換マイグレーション
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {import("../yrt_format.js").YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return layoutEntry;
        const doc = new DOMParser().parseFromString(layoutEntry.xml, "text/xml");
        convertDasharray(doc);
        return { ...layoutEntry, xml: new XMLSerializer().serializeToString(doc) };
    });
    // Style XMLにも同じ変換処理を適用
    let migratedStyle = yrtDocument.style;
    if (typeof migratedStyle === "string" && migratedStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(migratedStyle, "text/xml");
        convertDasharray(styleDoc);
        migratedStyle = new XMLSerializer().serializeToString(styleDoc);
    }
    return { ...yrtDocument, layouts: migratedLayouts, style: migratedStyle };
}

/**
 * @param {Document} doc
 */
function convertDasharray(doc) {
    const elements = doc.getElementsByTagName("*");
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.hasAttribute("borderStyle")) continue;
        const val = el.getAttribute("borderStyle");
        if (typeof val === "string") {
            const replaced = val.replace(/dasharray\(([^)]*)\)/gi, (_, inner) => {
                return inner.split(/\s*,\s*/).map((/** @type {string} */s) => s.trim()).join(":");
            });
            el.setAttribute("borderStyle", replaced);
        }
    }
}
