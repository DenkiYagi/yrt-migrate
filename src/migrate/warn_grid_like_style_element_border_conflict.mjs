// @ts-check
/**
 * Grid / Table / ColumnText 直下のスタイル要素同士で罫線の太さが不一致な場合に警告するモジュール。
 * 行・列範囲 (`row` / `col` 属性など) の重なりは解釈せず、値が異なるだけで衝突可能性ありと判断するため、
 * 実際には問題がないケースでも警告が出る（偽陽性がある）点に注意。
 */

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @type {Partial<Record<string, string>>}
 */
const STYLE_PARENT_CHILD_MAP = {
    Grid: "GridStyle",
    Table: "TableStyle",
    ColumnText: "ColumnTextStyle",
};

/**
 * @param {string | null} value
 * @returns {string[]}
 */
function expandThicknessValues(value) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return [];
    const arr = trimmed.split(/\s+/);
    if (arr.length === 1) return [arr[0] ?? "", arr[0] ?? "", arr[0] ?? "", arr[0] ?? ""];
    if (arr.length === 2) return [arr[0] ?? "", arr[1] ?? "", arr[0] ?? "", arr[1] ?? ""];
    if (arr.length === 3) return [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[1] ?? ""];
    return [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[3] ?? ""];
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function normalizeThickness(value) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return "";
    if (trimmed === "_") return "";
    return trimmed.toLowerCase();
}

/**
 * @param {Element} styleNode
 * @returns {Set<string>}
 */
function collectThicknessValues(styleNode) {
    const values = new Set();
    const border = normalizeThickness(styleNode.getAttribute("borderThickness"));
    if (border) values.add(border);
    const outerValues = expandThicknessValues(styleNode.getAttribute("outerBorderThickness"));
    for (const raw of outerValues) {
        const normalized = normalizeThickness(raw);
        if (normalized) values.add(normalized);
    }
    return values;
}

/**
 * @param {import("../diagnostics.mjs").Diagnostic[]} diagnostics
 * @param {Element} node
 * @param {string} originalXml
 */
function checkNode(diagnostics, node, originalXml) {
    const styleTagName = STYLE_PARENT_CHILD_MAP[node.tagName];
    if (styleTagName) {
        let elementsWithThickness = 0;
        const thicknessValues = new Set();
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (
                child &&
                child.nodeType === 1 &&
                "tagName" in child &&
                child.tagName === styleTagName
            ) {
                const valSet = collectThicknessValues(/** @type {Element} */ (child));
                if (valSet.size > 0) {
                    elementsWithThickness += 1;
                    for (const val of valSet) thicknessValues.add(val);
                }
            }
        }
        if (elementsWithThickness >= 2 && thicknessValues.size > 1) {
            warnWithLocation(
                diagnostics,
                originalXml,
                node,
                `${node.tagName} 直下に ${styleTagName} 要素が複数存在し、罫線の太さが均一ではありません。帳票エンジンの挙動変更に伴い、描画結果が変化している可能性があるため、実際のPDF出力を目視で確認し、必要に応じてレイアウトXMLを手動で調整してください。`
            );
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                checkNode(diagnostics, /** @type {Element} */ (child), originalXml);
            }
        }
    }
}

/**
 * Grid/Table/ColumnText スタイル要素間の罫線太さの競合を警告する
 * @param {import("../diagnostics.mjs").Diagnostic[]} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument?.documentElement) return;
    checkNode(diagnostics, originalDocument.documentElement, originalXml);
}
