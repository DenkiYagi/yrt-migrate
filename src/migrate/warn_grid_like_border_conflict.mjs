// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

const BORDER_TYPES = [
    { base: "borderThickness", keys: ["borderTopThickness", "borderRightThickness", "borderBottomThickness", "borderLeftThickness"] },
    { base: "borderStyle", keys: ["borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle"] },
    { base: "borderColor", keys: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"] },
];

/**
 * @param {Element} cell
 * @param {{ base: string, keys: string[] }} type
 * @returns {string[]}
 */
function expandBorderValues(cell, type) {
    let values = ["", "", "", ""];
    if (cell.hasAttribute(type.base)) {
        const arr = cell.getAttribute(type.base)?.split(/\s+/) ?? [];
        if (arr.length === 1) values = [arr[0] ?? "", arr[0] ?? "", arr[0] ?? "", arr[0] ?? ""];
        else if (arr.length === 2) values = [arr[0] ?? "", arr[1] ?? "", arr[0] ?? "", arr[1] ?? ""];
        else if (arr.length === 3) values = [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[1] ?? ""];
        else if (arr.length === 4) values = [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[3] ?? ""];
    }
    type.keys.forEach((key, d) => {
        if (cell.hasAttribute(key)) values[d] = cell.getAttribute(key) ?? "";
    });
    return values;
}

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function checkGridNode(node, originalXml) {
    const cols = (node.getAttribute("cols") || "").trim().split(/\s+/);
    const rows = (node.getAttribute("rows") || "").trim().split(/\s+/);
    const nCols = cols.length, nRows = rows.length;
    /** @type {Array<{cell: Element, row: number, col: number, colspan: number, rowspan: number}>} */
    const cellList = [];
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (
            child &&
            child.nodeType === 1 &&
            "tagName" in child &&
            typeof child.tagName === "string" &&
            "getAttribute" in child &&
            typeof child.getAttribute === "function" &&
            child.tagName === "GridCell"
        ) {
            const el = /** @type {Element} */ (child);
            const col = parseInt(el.getAttribute("col") || "0", 10);
            const row = parseInt(el.getAttribute("row") || "0", 10);
            const colspan = parseInt(el.getAttribute("colspan") || "1", 10);
            const rowspan = parseInt(el.getAttribute("rowspan") || "1", 10);
            if (!isNaN(row) && !isNaN(col) && row < nRows && col < nCols) {
                cellList.push({ cell: el, row, col, colspan, rowspan });
            }
        }
    }
    let warn = false;
    for (const type of BORDER_TYPES) {
        for (const { cell, row, col, colspan } of cellList) {
            const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
            if (rightCell) {
                const vals = expandBorderValues(cell, type);
                const rightVals = expandBorderValues(rightCell.cell, type);
                if (vals[1] !== "_" && rightVals[3] !== "_" && vals[1] !== "" && rightVals[3] !== "") {
                    warn = true;
                    break;
                }
            }
        }
        if (warn) break;
        for (const { cell, col, row, rowspan } of cellList) {
            const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
            if (bottomCell) {
                const vals = expandBorderValues(cell, type);
                const bottomVals = expandBorderValues(bottomCell.cell, type);
                if (vals[2] !== "_" && bottomVals[0] !== "_" && vals[2] !== "" && bottomVals[0] !== "") {
                    warn = true;
                    break;
                }
            }
        }
        if (warn) break;
    }
    if (warn) {
        warnWithLocation(originalXml, node, "隣接セルの罫線挙動が変わる可能性があります。必要に応じて手動で直してください。");
    }
}

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function checkTableNode(node, originalXml) {
    const columns = [];
    for (let i = 0; i < node.childNodes.length; i++) {
        const colNode = node.childNodes[i];
        if (colNode && colNode.nodeType === 1 && "tagName" in colNode && colNode.tagName === "TableColumn") {
            columns.push(colNode);
        }
    }
    const rowTypes = ["TableColumnHeader", "TableColumnTemplate", "TableColumnFooter"];
    const cellList = [];
    for (let rowIdx = 0; rowIdx < rowTypes.length; rowIdx++) {
        const rowType = rowTypes[rowIdx];
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
            const colNode = columns[colIdx];
            let cell = null;
            for (let t = 0; t < rowTypes.length; t++) {
                const type = rowTypes[t];
                for (let j = 0; j < colNode.childNodes.length; j++) {
                    const child = colNode.childNodes[j];
                    if (child && child.nodeType === 1 && "tagName" in child && child.tagName === type) {
                        if (type === rowType) {
                            cell = child;
                            break;
                        }
                    }
                }
                if (cell) break;
            }
            if (cell) {
                cellList.push({ cell, row: rowIdx, col: colIdx, colspan: 1, rowspan: 1 });
            }
        }
    }
    let warn = false;
    for (const type of BORDER_TYPES) {
        for (const { cell, row, col, colspan } of cellList) {
            const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
            if (rightCell) {
                const vals = expandBorderValues(/** @type {Element} */ (cell), type);
                const rightVals = expandBorderValues(/** @type {Element} */ (rightCell.cell), type);
                if (vals[1] !== "_" && rightVals[3] !== "_" && vals[1] !== "" && rightVals[3] !== "") {
                    warn = true;
                    break;
                }
            }
        }
        if (warn) break;
        for (const { cell, col, row, rowspan } of cellList) {
            const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
            if (bottomCell) {
                const vals = expandBorderValues(/** @type {Element} */ (cell), type);
                const bottomVals = expandBorderValues(/** @type {Element} */ (bottomCell.cell), type);
                if (vals[2] !== "_" && bottomVals[0] !== "_" && vals[2] !== "" && bottomVals[0] !== "") {
                    warn = true;
                    break;
                }
            }
        }
        if (warn) break;
    }
    if (warn) {
        warnWithLocation(originalXml, node, "隣接セルの罫線挙動が変わる可能性があります。必要に応じて手動で直してください。");
    }
}

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function traverse(node, originalXml) {
    if (node.tagName === "Grid") {
        checkGridNode(node, originalXml);
    } else if (node.tagName === "Table") {
        checkTableNode(node, originalXml);
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                traverse(/** @type {Element} */ (child), originalXml);
            }
        }
    }
}

/**
 * @param {string} xmlString
 * @param {string} originalXml
 */
function warnForAdjacentBorders(xmlString, originalXml) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    if (doc.documentElement) {
        traverse(doc.documentElement, originalXml);
    }
}

/**
 * Grid/Table の隣接セル罫線の競合を検出し警告を出す
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml
 * @returns {void}
 */
export function migrate(yrtDocument, originalXml) {
    for (const entry of yrtDocument.layouts) {
        warnForAdjacentBorders(entry.xml, originalXml);
    }
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        warnForAdjacentBorders(yrtDocument.style, originalXml);
    }
}
