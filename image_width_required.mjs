// <Image> 要素の width 属性必須化マイグレーション
// warnings: Array に警告文を push する

import { getXPath } from "./utils.js";

export function migrate(doc, yrtRoot, warnings) {
    // <Image> 要素をすべて取得
    const images = doc.getElementsByTagName("Image");
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (!image.hasAttribute("width")) {
            const xpath = getXPath(image);
            warnings.push(`Image要素にwidth属性がありません（XPath: ${xpath}）`);
        }
    }
    return yrtRoot;
}
