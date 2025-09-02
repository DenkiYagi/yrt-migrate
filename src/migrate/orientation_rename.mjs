// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * orientation属性の値を一括リネームするマイグレーション
 * - horizontal → landscape
 * - vertical → portrait
 *
 * @param {import('../yrt_format.js').YrtDocument} doc
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(doc) {
    return {
        layouts: doc.layouts.map(({ name, xml }) => {
            const dom = new DOMParser().parseFromString(xml, "text/xml");
            const allElems = dom.getElementsByTagName("*");
            for (let i = 0; i < allElems.length; i++) {
                const elem = allElems[i];
                if (elem.hasAttribute("orientation")) {
                    const val = elem.getAttribute("orientation");
                    if (val === "horizontal") {
                        elem.setAttribute("orientation", "landscape");
                    } else if (val === "vertical") {
                        elem.setAttribute("orientation", "portrait");
                    }
                }
            }
            return {
                name,
                xml: new XMLSerializer().serializeToString(dom.documentElement)
            };
        }),
        style: doc.style,
        assets: doc.assets,
    };
}
