import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

export function migrate(yrtRoot) {
    const yrtObj = Array.isArray(yrtRoot) && yrtRoot[0] === "YRT" ? yrtRoot[2] : yrtRoot;
    const { l: layouts = [] } = yrtObj;
    layouts.forEach(([_, xml]) => {
        if (!xml) return;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const images = doc.getElementsByTagName("Image");
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (!image.hasAttribute("width")) {
                const xpath = getXPath(image);
                console.warn(`[WARNING] Image要素にwidth属性がありません（XPath: ${xpath}）`);
            }
        }
    });
    return yrtRoot;
}
