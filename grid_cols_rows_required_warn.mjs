import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

/**
 * <Grid> の cols, rows 属性省略不可警告マイグレーション
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
        const grids = doc.getElementsByTagName("Grid");
        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];
            const cols = grid.getAttribute("cols")?.trim();
            const rows = grid.getAttribute("rows")?.trim();
            if (!cols || !rows) {
                const xpath = getXPath(grid);
                console.warn(`[WARNING] <Grid>のcols, rows属性は省略できません (両方必須): ${xpath}`);
            }
        }
    });
    return yrtRoot;
}
