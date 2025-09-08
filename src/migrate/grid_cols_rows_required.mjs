// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

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
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {import("../yrt_format.js").YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return layoutEntry;
        return {
            ...layoutEntry,
            xml: addGridColsRowsIfMissing(layoutEntry.xml)
        };
    });
    return { ...yrtDocument, layouts: migratedLayouts };
}
