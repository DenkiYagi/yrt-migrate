// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * <Image>要素のwidth属性必須化警告
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument, originalXml) {
    for (let i = 0; i < yrtDocument.layouts.length; i++) {
        const entry = yrtDocument.layouts[i];
        if (!entry.xml) continue;
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        const images = doc.getElementsByTagName("Image");
        for (let j = 0; j < images.length; j++) {
            const image = images[j];
            if (!image.hasAttribute("width")) {
                warnWithLocation(originalXml, image, "Image要素にwidth属性がありません");
            }
        }
    }

    return yrtDocument;
}
