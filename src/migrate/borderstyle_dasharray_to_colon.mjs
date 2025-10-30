// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * borderStyle属性 dasharray()→コロン区切り変換マイグレーション
 * @param {import("../yrt_format.js").MigratedXmlCollection} yrtDocument 変換対象のコレクション
 * @returns {import("../yrt_format.js").MigratedXmlCollection} 変換後のコレクション
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutXml => {
        if (typeof layoutXml !== "string") return layoutXml;
        const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
        convertDasharray(doc);
        return new XMLSerializer().serializeToString(doc);
    });
    // Style XMLにも同じ変換処理を適用
    let migratedStyle = yrtDocument.style ?? null;
    if (typeof migratedStyle === "string" && migratedStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(migratedStyle, "text/xml");
        convertDasharray(styleDoc);
        migratedStyle = new XMLSerializer().serializeToString(styleDoc);
    }
    return {
        layouts: migratedLayouts,
        style: migratedStyle,
    };
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
