import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

/**
 * <Table>要素のitems/breakCondition属性がバインド変数でなければ警告を出す
 * @param {any} yrtRoot - YRT構造
 */
export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    yrtRoot[2].l.forEach(layout => {
        let xml = layout;
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            xml = layout[1];
        }
        if (!xml) return;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
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
    });
    return yrtRoot;
}
