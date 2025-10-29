// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {string} xml
 * @param {string} originalXml
 */
function checkRectangleBorderRadiusMultiWarn(xml, originalXml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const rects = doc.getElementsByTagName("Rectangle");
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const borderRadius = rect.getAttribute("borderRadius");
        if (borderRadius === null) continue; // 未指定はOK
        const trimmed = borderRadius.trim();
        // スペース区切りで複数値の場合は警告
        if (trimmed.split(/\s+/).length > 1) {
            warnWithLocation(originalXml, rect, `<Rectangle>のborderRadius属性は単一値のみ許可されています`);
        }
    }
}

/**
 * <Rectangle> の borderRadius 属性で複数方向指定や空文字があれば警告を出すマイグレーション
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @param {string} originalXml - 元のYRT XML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    yrtDocument.layouts.forEach(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return;
        checkRectangleBorderRadiusMultiWarn(layoutEntry.xml, originalXml);
    });
    // Style XMLにも同じ関数で警告処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        checkRectangleBorderRadiusMultiWarn(yrtDocument.style, originalXml);
    }
}
