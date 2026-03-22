// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * @param {string} xml
 * @returns {string}
 */
function addGridColsRowsIfMissing(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const grids = doc.getElementsByTagName("Grid");
    for (let i = 0; i < grids.length; i++) {
        const grid = grids[i];
        let cols = grid.getAttribute("cols");
        let rows = grid.getAttribute("rows");
        if (!cols || cols.trim() === "") {
            grid.setAttribute("cols", "*");
        }
        if (!rows || rows.trim() === "") {
            grid.setAttribute("rows", "auto");
        }
    }
    return new XMLSerializer().serializeToString(doc);
}

/**
 * <Grid> の cols, rows 属性省略不可警告マイグレーション
 * @param {import("../yrt_format.js").MigratedXmlCollection} yrtDocument 変換対象のコレクション
 * @returns {import("../yrt_format.js").MigratedXmlCollection} 変換後のコレクション
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutXml => {
        if (typeof layoutXml !== "string") return layoutXml;
        return addGridColsRowsIfMissing(layoutXml);
    });
    return {
        layouts: migratedLayouts,
        style: yrtDocument.style ?? null,
    };
}
