import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

/**
 * <Rectangle> の borderRadius 属性で複数方向指定や空文字があれば警告を出すマイグレーション
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
        const rects = doc.getElementsByTagName("Rectangle");
        for (let i = 0; i < rects.length; i++) {
            const rect = rects[i];
            const borderRadius = rect.getAttribute("borderRadius");
            if (borderRadius === null) continue; // 未指定はOK
            const trimmed = borderRadius.trim();
            // 空文字、またはスペース区切りで複数値の場合は警告
            if (
                trimmed === "" ||
                trimmed.split(/\s+/).length > 1
            ) {
                const xpath = getXPath(rect);
                console.warn(`<Rectangle>のborderRadius属性は単一値のみ許可されています（複数値は不正）: ${xpath}`);
            }
        }
    });
    return yrtRoot;
}
