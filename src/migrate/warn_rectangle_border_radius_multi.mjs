// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} document
 * @param {string} originalXml
 */
function checkRectangleBorderRadiusMultiWarn(diagnostics, document, originalXml) {
    const rects = document.getElementsByTagName("Rectangle");
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        const borderRadius = rect.getAttribute("borderRadius");
        if (borderRadius === null) continue; // 未指定はOK
        const trimmed = borderRadius.trim();
        // スペース区切りで複数値の場合は警告
        if (trimmed.split(/\s+/).length > 1) {
            warnWithLocation(diagnostics, originalXml, rect, [
                "Rectangle要素のborderRadius属性では、四隅に異なる値を指定することができなくなりました。",
                "単一の数値を指定してください。"
            ]);
        }
    }
}

/**
 * <Rectangle> の borderRadius 属性で複数方向指定や空文字があれば警告を出すマイグレーション
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument) return;
    checkRectangleBorderRadiusMultiWarn(diagnostics, originalDocument, originalXml);
}
