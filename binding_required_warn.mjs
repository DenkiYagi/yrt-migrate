import { getXPath } from "./utils.js";

/**
 * <Table>要素のitems/breakCondition属性がバインド変数でなければ警告を出す
 * @param {Document} doc - xmldomのDocument
 */
export function migrate(doc) {
    const tables = Array.from(doc.getElementsByTagName("Table"));
    for (const table of tables) {
        const xpath = getXPath(table);
        // items属性
        const items = table.getAttribute("items");
        if (items && !/^\$\{[^}]+\}$/.test(items)) {
            console.warn(`items属性はバインド変数で指定してください: ${items} (${xpath})`);
        }
        // breakCondition属性
        const breakCond = table.getAttribute("breakCondition");
        if (breakCond && !/^\$\{[^}]+\}$/.test(breakCond)) {
            console.warn(`breakCondition属性はバインド変数で指定してください: ${breakCond} (${xpath})`);
        }
    }
    return doc;
}
