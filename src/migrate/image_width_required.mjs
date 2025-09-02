// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * <Image>要素のwidth属性必須化警告
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    for (let i = 0; i < yrtDocument.layouts.length; i++) {
        const entry = yrtDocument.layouts[i];
        if (!entry.xml) continue;
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        const images = doc.getElementsByTagName("Image");
        for (let j = 0; j < images.length; j++) {
            const image = images[j];
            if (!image.hasAttribute("width")) {
                const xpath = getXPath(image);
                console.warn(`[WARNING] Image要素にwidth属性がありません（XPath: ${xpath}）`);
            }
        }
    }
    // Style XMLにも同様の処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(yrtDocument.style, "text/xml");
        const images = styleDoc.getElementsByTagName("Image");
        for (let j = 0; j < images.length; j++) {
            const image = images[j];
            if (!image.hasAttribute("width")) {
                const xpath = getXPath(image);
                console.warn(`[WARNING] Image要素にwidth属性がありません（Style XML, XPath: ${xpath}）`);
            }
        }
    }
    return yrtDocument;
}
