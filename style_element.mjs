/**
 * Grid/Table/ColumnText の XxxStyle を Style要素に分離するマイグレーション
 *
 * - <Grid>/<Table>/<ColumnText> 直下の <GridStyle>/<TableStyle>/<ColumnTextStyle> を検出
 * - 一意なIDを生成し、親要素に style属性を付与
 * - Style要素配下に親要素のコピー（key属性付き）を追加し、CellRange配下にXxxStyleの属性を移行
 * - 元のXxxStyle要素は削除
 *
 * Copyright 2025 DenkiYagi Inc.
 * Licensed under the Apache License, Version 2.0
 */

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * YrtRootのみを受け取り、layouts配列のxmlを変換し、sプロパティにStyle XMLを格納して返す
 * @param {Array} yrtRoot
 * @returns {Array} 変換後のYrtRoot
 */
export function migrate(yrtRoot) {
    if (!Array.isArray(yrtRoot) || yrtRoot.length < 3 || !yrtRoot[2] || !Array.isArray(yrtRoot[2].l)) {
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

    const layouts = [];
    for (let i = 0; i < yrtRoot[2].l.length; i++) {
        const [name, xml] = yrtRoot[2].l[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        for (const { tag, styleTag } of STYLE_TARGETS) {
            const targets = Array.from(doc.getElementsByTagName(tag));
            for (const target of targets) {
                const styleElems = Array.from(target.getElementsByTagName(styleTag));
                for (const styleElem of styleElems) {
                    styleAdded = true;
                    const styleId = `styleelement-${styleIndex++}`;
                    target.setAttribute("style", styleId);
                    // Style XMLに追加
                    const styleTargetElem = styleDoc.createElement(tag);
                    styleTargetElem.setAttribute("key", styleId);
                    const cellRange = styleDoc.createElement("CellRange");
                    for (let j = 0; j < styleElem.attributes.length; j++) {
                        const attr = styleElem.attributes[j];
                        cellRange.setAttribute(attr.name, attr.value);
                    }
                    if (!cellRange.hasAttribute("col")) {
                        cellRange.setAttribute("col", "all");
                    }
                    if (!cellRange.hasAttribute("row")) {
                        cellRange.setAttribute("row", "all");
                    }
                    styleTargetElem.appendChild(cellRange);
                    styleRoot.appendChild(styleTargetElem);
                    target.removeChild(styleElem);
                }
            }
        }
        // 変換後のXMLをlayouts配列にpush
        layouts.push([name, new XMLSerializer().serializeToString(doc.documentElement)]);
    }
    // YRT構造に反映
    yrtRoot[2].l = layouts;
    yrtRoot[2].s = styleAdded ? new XMLSerializer().serializeToString(styleRoot) : null;
    return yrtRoot;
}
