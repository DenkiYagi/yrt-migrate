// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * @param {string} xml
 */
function checkTableBindingWarn(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const tables = Array.from(doc.getElementsByTagName("Table"));
    for (const table of tables) {
        const xpath = getXPath(table);
        // items属性
        const items = table.getAttribute("items")?.trim();
        if (items && !/^\$\{[^}]+\}$/.test(items)) {
            console.warn(`[WARNING] items属性はバインド変数で指定してください: ${items} (${xpath})`);
        }
        // breakCondition属性
        const breakCond = table.getAttribute("breakCondition")?.trim();
        if (breakCond && !/^\$\{[^}]+\}$/.test(breakCond)) {
            console.warn(`[WARNING] breakCondition属性はバインド変数で指定してください: ${breakCond} (${xpath})`);
        }
    }
}

/**
 * <Table>要素のitems/breakCondition属性がバインド変数でなければ警告を出す
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    yrtDocument.layouts.forEach(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return;
        checkTableBindingWarn(layoutEntry.xml);
    });
    // Style XMLにも同じ関数で警告処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        checkTableBindingWarn(yrtDocument.style);
    }
}
