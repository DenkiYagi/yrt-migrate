// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <LinearLayout>/<StackLayout> size属性 カンマ→スペース変換マイグレーション
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {import("../yrt_format.js").YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return layoutEntry;
        const doc = new DOMParser().parseFromString(layoutEntry.xml, "text/xml");
        convertSizeCommaToSpace(doc);
        return { ...layoutEntry, xml: new XMLSerializer().serializeToString(doc) };
    });
    // Style XMLにも同じ変換処理を適用
    let migratedStyle = yrtDocument.style;
    if (typeof migratedStyle === "string" && migratedStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(migratedStyle, "text/xml");
        convertSizeCommaToSpace(styleDoc);
        migratedStyle = new XMLSerializer().serializeToString(styleDoc);
    }
    return { ...yrtDocument, layouts: migratedLayouts, style: migratedStyle };
}

function convertSizeCommaToSpace(doc) {
    const targets = ["LinearLayout", "StackLayout"];
    for (const tag of targets) {
        const elements = doc.getElementsByTagName(tag);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const val = el.getAttribute && el.getAttribute("size");
            if (typeof val === "string" && val.includes(",")) {
                // カンマ区切り（スペースあり・なし両対応）をスペース区切りに
                const spaced = val.split(/\s*,\s*/).join(" ");
                el.setAttribute("size", spaced);
            }
        }
    }
}
