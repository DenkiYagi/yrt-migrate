// @ts-check

import { DOMParser } from "@xmldom/xmldom";
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
 * @param {Element} node
 * @param {string} originalXml
 */
function checkNode(node, originalXml) {
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
                originalXml,
                node,
                `${node.tagName} 直下の ${styleTagName} 要素で罫線の太さが異なる可能性があります。必要に応じて手動で調整してください。`
            );
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                checkNode(/** @type {Element} */ (child), originalXml);
            }
        }
    }
}

/**
 * @param {string} xmlString
 * @param {string} originalXml
 */
function warnForStyleBorderConflict(xmlString, originalXml) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    checkNode(doc.documentElement, originalXml);
}

/**
 * Grid/Table/ColumnText スタイル要素間の罫線太さの競合を警告する
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument
 * @param {string} originalXml
 * @returns {void}
 */
export function migrate(yrtDocument, originalXml) {
    for (const entry of yrtDocument.layouts) {
        warnForStyleBorderConflict(entry.xml, originalXml);
    }
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        warnForStyleBorderConflict(yrtDocument.style, originalXml);
    }
}
