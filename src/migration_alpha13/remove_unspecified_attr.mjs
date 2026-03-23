// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * @param {import('./yrt_format.js').MigratedXmlCollection} doc
 */
export function migrate(doc) {
    return {
        layouts: doc.layouts.map((xml) => {
            const dom = new DOMParser().parseFromString(xml, "text/xml");
            /**
             * @param {Element} node
             */
            function removeUnspecifiedAttrs(node) {
                if (node.nodeType !== 1) return;
                const attrs = Array.from(node.attributes);
                for (const attr of attrs) {
                    if (attr.value === "unspecified") {
                        node.removeAttribute(attr.name);
                    }
                }
                for (let child = node.firstChild; child; child = child.nextSibling) {
                    if (child.nodeType === 1) {
                        removeUnspecifiedAttrs(/** @type {Element} */(child));
                    }
                }
            }
            removeUnspecifiedAttrs(dom.documentElement);
            return new XMLSerializer().serializeToString(dom.documentElement);
        }),
        style: doc.style ?? null,
    };
}
