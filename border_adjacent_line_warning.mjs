import { getXPath } from "./utils.js";
import { DOMParser } from "xmldom";

/**
 * レイアウトの隣接部の罫線属性を検出し、警告を出すマイグレーション
 * @param {any} yrtRoot YRT構造
 * @returns {any} 変換後YRT構造
 */
export function migrate(yrtRoot) {
    if (!Array.isArray(yrtRoot) || yrtRoot[0] !== "YRT") return yrtRoot;
    const layouts = yrtRoot[2]?.l;
    if (!Array.isArray(layouts)) return yrtRoot;

    const targets = ["LayoutHeader", "LayoutBody", "LayoutFooter"];
    const attrs = ["borderThickness", "borderColor", "borderStyle"];

    for (const layout of layouts) {
        if (!layout) continue;
        const layoutXml = Array.isArray(layout) ? layout[1] : layout;
        if (!layoutXml) continue;
        let doc;
        try {
            doc = new DOMParser().parseFromString(layoutXml, "text/xml");
        } catch (e) {
            continue;
        }
        for (const tag of targets) {
            const nodes = Array.from(doc.getElementsByTagName(tag));
            for (const node of nodes) {
                for (const attr of attrs) {
                    if (node.hasAttribute(attr)) {
                        const xpath = getXPath(node);
                        console.warn(
                            `[WARNING] ${tag} 要素(${xpath})に${attr}属性が含まれています。罫線のレイアウトが変わる可能性があります。`
                        );
                    }
                }
            }
        }
    }
    return yrtRoot;
}
