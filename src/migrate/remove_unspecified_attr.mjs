// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export function migrate(doc) {
    return {
        layouts: doc.layouts.map(({ name, xml }) => {
            const dom = new DOMParser().parseFromString(xml, "text/xml");
            function removeUnspecifiedAttrs(node) {
                if (node.nodeType !== 1) return;
                const attrs = Array.from(node.attributes);
                for (const attr of attrs) {
                    if (attr.value === "unspecified") {
                        node.removeAttribute(attr.name);
                    }
                }
                for (let child = node.firstChild; child; child = child.nextSibling) {
                    removeUnspecifiedAttrs(child);
                }
            }
            removeUnspecifiedAttrs(dom.documentElement);
            return {
                name,
                xml: new XMLSerializer().serializeToString(dom.documentElement)
            };
        }),
        style: doc.style,
        assets: doc.assets,
    };
}
