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
        const val = el.getAttribute && el.getAttribute("borderStyle");
        if (typeof val === "string") {
            const m = val.match(/^\s*dasharray\((.*)\)\s*$/i);
            if (m) {
                // dasharray(...) の中身を安全に抽出
                const inner = m[1];
                const colon = inner.split(/\s*,\s*/).join(":");
                el.setAttribute("borderStyle", colon);
            }
        }
    }
}
