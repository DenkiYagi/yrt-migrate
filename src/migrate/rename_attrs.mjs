import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export function migrate(yrtRoot) {
    // layouts配列の各XMLに対して属性名リネームを実施
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    const layouts = yrtRoot[2].l.map(layout => {
        if (!layout) return layout;
        // [null, xmlString] 形式の場合は2番目のみ変換
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            const doc = new DOMParser().parseFromString(layout[1], "text/xml");
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
            return [null, new XMLSerializer().serializeToString(doc)];
        } else if (typeof layout === "string") {
            // 文字列の場合はそのまま変換
            const doc = new DOMParser().parseFromString(layout, "text/xml");
            const tables = doc.getElementsByTagName("Table");
            for (let i = 0; i < tables.length; i++) {
                const el = tables[i];
                if (el.hasAttribute("pageBreakCondition")) {
                    const val = el.getAttribute("pageBreakCondition");
                    el.setAttribute("breakCondition", val);
                    el.removeAttribute("pageBreakCondition");
                }
            }
            const grids = doc.getElementsByTagName("Grid");
            for (let i = 0; i < grids.length; i++) {
                const el = grids[i];
                if (el.hasAttribute("borderRadius")) {
                    const val = el.getAttribute("borderRadius");
                    el.setAttribute("outerBorderRadius", val);
                    el.removeAttribute("borderRadius");
                }
            }
            return new XMLSerializer().serializeToString(doc);
        }
        return layout;
    });
    const next = [yrtRoot[0], yrtRoot[1], { ...yrtRoot[2], l: layouts }];
    return next;
}
