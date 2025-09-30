// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {string} xml
 * @param {string} originalXml
 */
function checkTableBindingWarn(xml, originalXml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const tables = Array.from(doc.getElementsByTagName("Table"));
    for (const table of tables) {
        // items属性
        const items = table.getAttribute("items")?.trim();
        if (items && !/^\$\{[^}]+\}$/.test(items)) {
            warnWithLocation(originalXml, table, `items属性はバインド変数で指定してください`);
        }
        // breakCondition属性
        const breakCond = table.getAttribute("breakCondition")?.trim();
        if (breakCond && !/^\$\{[^}]+\}$/.test(breakCond)) {
            warnWithLocation(originalXml, table, `breakCondition属性はバインド変数で指定してください`);
        }
    }
}

/**
 * <Table>要素のitems/breakCondition属性がバインド変数でなければ警告を出す
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @param {string} originalXml - 元のYRT XML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    yrtDocument.layouts.forEach(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return;
        checkTableBindingWarn(layoutEntry.xml, originalXml);
    });
    // Style XMLにも同じ関数で警告処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        checkTableBindingWarn(yrtDocument.style, originalXml);
    }
}
