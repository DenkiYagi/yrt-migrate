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

export function migrate(doc, yrtData = null) {
    // 1レイアウト1XMLまたは配列で受け取る
    const STYLE_TARGETS = [
        { tag: "Grid", styleTag: "GridStyle" },
        { tag: "Table", styleTag: "TableStyle" },
        { tag: "ColumnText", styleTag: "ColumnTextStyle" },
    ];
    let styleIndex = 1;
    const styleDoc = new DOMParser().parseFromString(
        '<?xml version="1.0" encoding="UTF-8"?><Style></Style>',
        "text/xml"
    );
    const styleRoot = styleDoc.documentElement;

    const docs = Array.isArray(doc) ? doc : [doc];
    for (const d of docs) {
        for (const { tag, styleTag } of STYLE_TARGETS) {
            const targets = Array.from(d.getElementsByTagName(tag));
            for (const target of targets) {
                const styleElem = target.getElementsByTagName(styleTag)[0];
                if (styleElem) {
                    const styleId = `styleelement-${styleIndex++}`;
                    target.setAttribute("style", styleId);
                    // Style XMLに追加
                    const styleTargetElem = styleDoc.createElement(tag);
                    styleTargetElem.setAttribute("key", styleId);
                    const cellRange = styleDoc.createElement("CellRange");
                    for (let i = 0; i < styleElem.attributes.length; i++) {
                        const attr = styleElem.attributes[i];
                        cellRange.setAttribute(attr.name, attr.value);
                    }
                    styleTargetElem.appendChild(cellRange);
                    styleRoot.appendChild(styleTargetElem);
                    target.removeChild(styleElem);
                }
            }
        }
    }

    // YRTデータ形式の場合はsプロパティにStyle XMLを格納
    if (yrtData && Array.isArray(yrtData) && yrtData.length > 2 && yrtData[2]) {
        yrtData[2].s = new XMLSerializer().serializeToString(styleRoot);
        return yrtData;
    }

    // それ以外は { layouts: [XML文字列...], styleXml: XML文字列 } を返す
    const layouts = docs.map((d) =>
        new XMLSerializer().serializeToString(d.documentElement)
    );
    const styleXml = new XMLSerializer().serializeToString(styleRoot);
    return { layouts, styleXml };
}
