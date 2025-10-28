// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";


/**
 * YrtDocument型のみを受け取り、layouts配列のxmlを変換し、styleプロパティにStyle XMLを格納して返す
 * @param {string} originalXml - 変換前のXML文字列
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) {
        throw new Error("style_element.mjs: 入力がYRT構造ではありません");
    }
    const STYLE_TARGETS = [
        { tag: "Grid", styleTag: "GridStyle" },
        { tag: "Table", styleTag: "TableStyle" },
        { tag: "ColumnText", styleTag: "ColumnTextStyle" },
    ];
    let styleIndex = 1;
    let styleAdded = false;
    const styleDoc = new DOMParser().parseFromString(
        '<?xml version="1.0" encoding="UTF-8"?><Style></Style>',
        "text/xml"
    );
    const styleRoot = styleDoc.documentElement;

    const newLayouts = [];
    for (const layoutEntry of yrtDocument.layouts) {
        const { name, xml } = layoutEntry;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        for (const { tag, styleTag } of STYLE_TARGETS) {
            const targets = Array.from(doc.getElementsByTagName(tag));
            for (const target of targets) {
                const styleElems = Array.from(target.getElementsByTagName(styleTag));
                if (styleElems.length > 0) {
                    styleAdded = true;
                    const styleId = `style-${styleIndex++}`;
                    target.setAttribute("rangeStyle", styleId);

                    // Style XMLにCellRangeList要素を追加
                    const rangeListElem = styleDoc.createElement("CellRangeList");
                    rangeListElem.setAttribute("key", styleId);

                    // 各styleElemをCellRangeとして親要素に追加
                    for (const styleElem of styleElems) {
                        const cellRange = styleDoc.createElement("CellRange");
                        for (let j = 0; j < styleElem.attributes.length; j++) {
                            const attr = styleElem.attributes[j];
                            cellRange.setAttribute(attr.name, attr.value);
                            // バインド変数判定: ${...} で始まり終わるもののみ
                            if (
                                typeof attr.value === "string" &&
                                /^\$\{[^}]+\}$/.test(attr.value)
                            ) {
                                warnWithLocation(
                                    originalXml,
                                    styleElem,
                                    `${styleTag} の ${attr.name} 属性値にバインド変数 (${attr.value}) が含まれています`
                                );
                            }
                        }
                        if (!cellRange.hasAttribute("col")) {
                            cellRange.setAttribute("col", "all");
                        }
                        // ColumnText以外の場合のみrow="all"を補完
                        if (tag !== "ColumnText" && !cellRange.hasAttribute("row")) {
                            cellRange.setAttribute("row", "all");
                        }
                        rangeListElem.appendChild(cellRange);
                        removeWhitespaceBefore(styleElem);
                        target.removeChild(styleElem);
                    }

                    styleRoot.appendChild(rangeListElem);
                }
            }
        }
        // 変換後のXMLをlayouts配列にpush
        newLayouts.push({ name, xml: new XMLSerializer().serializeToString(doc.documentElement) });
    }
    return {
        layouts: newLayouts,
        style: styleAdded ? new XMLSerializer().serializeToString(styleRoot) : null,
        assets: yrtDocument.assets ?? null
    };
}

/**
 * 判定対象のノードが空白文字のみで構成されているテキストノードかどうかを返す
 * @param {Node | null | undefined} node
 * @returns {boolean}
 */
function isWhitespaceOnlyText(node) {
    if (!node || node.nodeType !== 3) {
        return false;
    }
    const textValue = node.nodeValue ?? "";
    return /^\s*$/.test(textValue);
}

/**
 * 指定ノードの直前に存在する空白のみのテキストノードを削除する
 * @param {Node} node
 * @returns {void}
 */
function removeWhitespaceBefore(node) {
    let prev = node.previousSibling;
    while (prev && isWhitespaceOnlyText(prev)) {
        const toRemove = prev;
        prev = prev.previousSibling;
        toRemove.parentNode?.removeChild(toRemove);
    }
}
