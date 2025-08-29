import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    const layouts = yrtRoot[2].l.map(layout => {
        if (!layout) return layout;
        // [null, xmlString] 形式の場合は2番目のみ変換
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            const doc = new DOMParser().parseFromString(layout[1], "text/xml");
            convertDasharray(doc);
            return [null, new XMLSerializer().serializeToString(doc)];
        } else if (typeof layout === "string") {
            const doc = new DOMParser().parseFromString(layout, "text/xml");
            convertDasharray(doc);
            return new XMLSerializer().serializeToString(doc);
        }
        return layout;
    });
    const next = [yrtRoot[0], yrtRoot[1], { ...yrtRoot[2], l: layouts }];
    return next;
}

function convertDasharray(doc) {
    const elements = doc.getElementsByTagName("*");
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el.hasAttribute("borderStyle")) continue;
        const val = el.getAttribute("borderStyle");
        if (typeof val === "string") {
            const replaced = val.replace(/dasharray\(([^)]*)\)/gi, (_, inner) => {
                return inner.split(/\s*,\s*/).map(s => s.trim()).join(":");
            });
            el.setAttribute("borderStyle", replaced);
        }
    }
}
