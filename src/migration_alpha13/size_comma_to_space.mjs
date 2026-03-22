// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <LinearLayout>/<StackLayout> size属性 カンマ→スペース変換マイグレーション
 * @param {import("./yrt_format.js").MigratedXmlCollection} yrtDocument 変換対象のコレクション
 * @returns {import("./yrt_format.js").MigratedXmlCollection} 変換後のコレクション
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutXml => {
        if (typeof layoutXml !== "string") return layoutXml;
        const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
        convertSizeCommaToSpace(doc);
        return new XMLSerializer().serializeToString(doc);
    });
    // Style XMLにも同じ変換処理を適用
    let migratedStyle = yrtDocument.style ?? null;
    if (typeof migratedStyle === "string" && migratedStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(migratedStyle, "text/xml");
        convertSizeCommaToSpace(styleDoc);
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
