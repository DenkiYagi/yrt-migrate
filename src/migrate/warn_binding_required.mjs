// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} document
 * @param {string} originalXml
 */
function checkTableBindingWarn(diagnostics, document, originalXml) {
    const tables = Array.from(document.getElementsByTagName("Table"));
    for (const table of tables) {
        // items属性
        const items = table.getAttribute("items")?.trim();
        if (items && !/^\$\{[^}]+\}$/.test(items)) {
            warnWithLocation(diagnostics, originalXml, table, [`items属性はバインド変数で指定してください`]);
        }
        // breakCondition属性
        const breakCond = table.getAttribute("breakCondition")?.trim();
        if (breakCond && !/^\$\{[^}]+\}$/.test(breakCond)) {
            warnWithLocation(diagnostics, originalXml, table, [`breakCondition属性はバインド変数で指定してください`]);
        }
    }
}

/**
 * <Table>要素のitems/breakCondition属性がバインド変数でなければ警告を出す
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    checkTableBindingWarn(diagnostics, originalDocument, originalXml);
}
