// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";


/**
 * レイアウトXMLを変換し、必要に応じてStyle XMLを抽出する
 * @param {import('./yrt_format.js').MigratedXmlCollection} yrtDocument
 * @returns {import('./yrt_format.js').MigratedXmlCollection} 変換後のコレクション
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) {
        throw new Error("style_element.mjs: 入力が期待したレイアウト配列ではありません");
    }
    const STYLE_TARGETS = [
        { tag: "Grid", styleTag: "GridStyle" },
        { tag: "Table", styleTag: "TableStyle" },
        { tag: "ColumnText", styleTag: "ColumnTextStyle" },
    ];
    let styleIndex = 1;
    let styleAdded = false;
    let styleDoc;
    let styleRoot;
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        styleDoc = new DOMParser().parseFromString(yrtDocument.style, "text/xml");
        styleRoot = styleDoc.documentElement;
        if (!styleRoot || styleRoot.tagName === "parsererror") {
            throw new Error("style_element.mjs: 既存のStyle XMLが不正です");
        }
    } else {
        styleDoc = new DOMParser().parseFromString(
            '<?xml version="1.0" encoding="UTF-8"?><Style></Style>',
            "text/xml"
        );
        styleRoot = styleDoc.documentElement;
    }

    const newLayouts = [];
    for (const xml of yrtDocument.layouts) {
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
        newLayouts.push(new XMLSerializer().serializeToString(doc.documentElement));
    }
    let nextStyle = yrtDocument.style ?? null;
    return {
        layouts: newLayouts,
        style: styleAdded ? new XMLSerializer().serializeToString(styleRoot) : nextStyle
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
