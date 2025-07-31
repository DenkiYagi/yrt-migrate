// Table要素のpageBreakCondition→breakCondition、Grid要素のborderRadius→outerBorderRadius の属性名リネーム
export function migrate(doc, yrtRoot) {
    // Table要素のpageBreakCondition→breakCondition
    const tables = doc.getElementsByTagName("Table");
    for (let i = 0; i < tables.length; i++) {
        const el = tables[i];
        if (el.hasAttribute("pageBreakCondition")) {
            const val = el.getAttribute("pageBreakCondition");
            el.setAttribute("breakCondition", val);
            el.removeAttribute("pageBreakCondition");
        }
    }
    // Grid要素のborderRadius→outerBorderRadius
    const grids = doc.getElementsByTagName("Grid");
    for (let i = 0; i < grids.length; i++) {
        const el = grids[i];
        if (el.hasAttribute("borderRadius")) {
            const val = el.getAttribute("borderRadius");
            el.setAttribute("outerBorderRadius", val);
            el.removeAttribute("borderRadius");
        }
    }
    return yrtRoot;
}
