// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * @param {string} xml
 */
function checkBorderAdjacentLineWarn(xml) {
    const targets = ["LayoutHeader", "LayoutBody", "LayoutFooter"];
    const attrs = ["borderThickness", "borderColor", "borderStyle"];
    let doc;
    try {
        doc = new DOMParser().parseFromString(xml, "text/xml");
    } catch (e) {
        return;
    }
    for (const tag of targets) {
        const nodes = Array.from(doc.getElementsByTagName(tag));
        for (const node of nodes) {
            for (const attr of attrs) {
                if (node.hasAttribute(attr)) {
                    const xpath = getXPath(node);
                    console.warn(
                        `[WARNING] ${tag} 要素(${xpath})に${attr}属性が含まれています。罫線のレイアウトが変わる可能性があります。`
                    );
                }
            }
        }
    }
}

/**
 * レイアウトの隣接部の罫線属性を検出し、警告を出すマイグレーション
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    yrtDocument.layouts.forEach(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return;
        checkBorderAdjacentLineWarn(layoutEntry.xml);
    });
    // Style XMLにも同じ関数で警告処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        checkBorderAdjacentLineWarn(yrtDocument.style);
    }
}
