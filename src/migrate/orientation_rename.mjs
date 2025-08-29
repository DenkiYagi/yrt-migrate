import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * orientation属性の値を一括リネームするマイグレーション
 * - horizontal → landscape
 * - vertical → portrait
 *
 * @param {Array} yrtRoot
 * @returns {Array} 変換後のYrtRoot
 */
export function migrate(yrtRoot) {
    if (!Array.isArray(yrtRoot) || yrtRoot.length < 3 || !yrtRoot[2] || !Array.isArray(yrtRoot[2].l)) {
        throw new Error("orientation_rename.mjs: 入力がYRT構造ではありません");
    }
    const layouts = [];
    for (let i = 0; i < yrtRoot[2].l.length; i++) {
        const [name, xml] = yrtRoot[2].l[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const allElems = doc.getElementsByTagName("*");
        for (let j = 0; j < allElems.length; j++) {
            const elem = allElems[j];
            if (elem.hasAttribute("orientation")) {
                const val = elem.getAttribute("orientation");
                if (val === "horizontal") {
                    elem.setAttribute("orientation", "landscape");
                } else if (val === "vertical") {
                    elem.setAttribute("orientation", "portrait");
                }
            }
        }
        layouts.push([name, new XMLSerializer().serializeToString(doc.documentElement)]);
    }
    yrtRoot[2].l = layouts;
    return yrtRoot;
}
