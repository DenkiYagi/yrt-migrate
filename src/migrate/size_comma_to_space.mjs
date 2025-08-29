import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <LinearLayout>/<StackLayout> size属性 カンマ→スペース変換マイグレーション
 * @param {any} yrtRoot - YRT構造
 * @returns {any}
 */
export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    const layouts = yrtRoot[2].l.map(layout => {
        if (!layout) return layout;
        // [null, xmlString] 形式の場合は2番目のみ変換
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            const doc = new DOMParser().parseFromString(layout[1], "text/xml");
            convertSizeCommaToSpace(doc);
            return [null, new XMLSerializer().serializeToString(doc)];
        } else if (typeof layout === "string") {
            const doc = new DOMParser().parseFromString(layout, "text/xml");
            convertSizeCommaToSpace(doc);
            return new XMLSerializer().serializeToString(doc);
        }
        return layout;
    });
    const next = [yrtRoot[0], yrtRoot[1], { ...yrtRoot[2], l: layouts }];
    return next;
}

function convertSizeCommaToSpace(doc) {
    const targets = ["LinearLayout", "StackLayout"];
    for (const tag of targets) {
        const elements = doc.getElementsByTagName(tag);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const val = el.getAttribute && el.getAttribute("size");
            if (typeof val === "string" && val.includes(",")) {
                // カンマ区切り（スペースあり・なし両対応）をスペース区切りに
                const spaced = val.split(/\s*,\s*/).join(" ");
                el.setAttribute("size", spaced);
            }
        }
    }
}
