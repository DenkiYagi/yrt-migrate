// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

const BORDER_THICKNESS_SIDE_SPECIFIC_KEYS = [
    "borderTopThickness",
    "borderRightThickness",
    "borderBottomThickness",
    "borderLeftThickness",
];

/**
 * @param {Element} cell
 * @returns {string[]}
 */
function expandBorderThickness(cell) {
    let values = ["", "", "", ""]; // top, right, bottom, left
    if (cell.hasAttribute("borderThickness")) {
        const attr = cell.getAttribute("borderThickness") ?? "";
        const trimmed = attr.trim();
        const arr = trimmed.length > 0 ? trimmed.split(/\s+/) : [];
        if (arr.length === 1) values = [arr[0] ?? "", arr[0] ?? "", arr[0] ?? "", arr[0] ?? ""];
        else if (arr.length === 2) values = [arr[0] ?? "", arr[1] ?? "", arr[0] ?? "", arr[1] ?? ""];
        else if (arr.length === 3) values = [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[1] ?? ""];
        else if (arr.length === 4) values = [arr[0] ?? "", arr[1] ?? "", arr[2] ?? "", arr[3] ?? ""];
    }
    BORDER_THICKNESS_SIDE_SPECIFIC_KEYS.forEach((key, d) => {
        if (cell.hasAttribute(key)) values[d] = cell.getAttribute(key) ?? "";
    });
    return values;
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeThickness(value) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return "";
    if (trimmed === "_") return "";
    return trimmed.toLowerCase();
}

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} node
 * @param {string} originalXml
 */
function checkGridNode(diagnostics, node, originalXml) {
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
    /** @type {Map<Element, string[]>} */
    const thicknessCache = new Map();
    /**
     * @param {Element} cell
     * @returns {string[]}
     */
    function getThickness(cell) {
        let cached = thicknessCache.get(cell);
        if (!cached) {
            cached = expandBorderThickness(cell);
            thicknessCache.set(cell, cached);
        }
        return cached;
    }
    let warn = false;
    for (const { cell, row, col, colspan } of cellList) {
        const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
        if (rightCell) {
            const vals = getThickness(cell);
            const rightVals = getThickness(rightCell.cell);
            const right = normalizeThickness(vals[1]);
            const left = normalizeThickness(rightVals[3]);
            if (right && left && right !== left) {
                warn = true;
                break;
            }
        }
    }
    if (!warn) {
        for (const { cell, col, row, rowspan } of cellList) {
            const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
            if (bottomCell) {
                const vals = getThickness(cell);
                const bottomVals = getThickness(bottomCell.cell);
                const bottom = normalizeThickness(vals[2]);
                const top = normalizeThickness(bottomVals[0]);
                if (bottom && top && bottom !== top) {
                    warn = true;
                    break;
                }
            }
        }
    }
    if (warn) {
        warnWithLocation(diagnostics, originalXml, node, [
            "隣接セル間の罫線について、太さの設定が衝突している箇所があります。",
            "帳票エンジンの挙動変更に伴い、描画結果が変化している可能性があります。",
            "実際のPDF出力を目視で確認し、必要に応じてレイアウトXMLを手動で調整してください。"
        ]);
    }
}

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} node
 * @param {string} originalXml
 */
function checkTableNode(diagnostics, node, originalXml) {
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
    /** @type {Map<Element, string[]>} */
    const thicknessCache = new Map();
    /**
     * @param {Element} cell
     * @returns {string[]}
     */
    function getThickness(cell) {
        let cached = thicknessCache.get(cell);
        if (!cached) {
            cached = expandBorderThickness(cell);
            thicknessCache.set(cell, cached);
        }
        return cached;
    }
    let warn = false;
    const templateRowIndex = rowTypes.indexOf("TableColumnTemplate");
    for (const { cell, row, col, colspan } of cellList) {
        const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
        if (rightCell) {
            const vals = getThickness(/** @type {Element} */(cell));
            const rightVals = getThickness(/** @type {Element} */(rightCell.cell));
            const right = normalizeThickness(vals[1]);
            const left = normalizeThickness(rightVals[3]);
            if (right && left && right !== left) {
                warn = true;
                break;
            }
        }
    }
    if (!warn) {
        for (const { cell, col, row, rowspan } of cellList) {
            const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
            if (bottomCell) {
                const vals = getThickness(/** @type {Element} */(cell));
                const bottomVals = getThickness(/** @type {Element} */(bottomCell.cell));
                const bottom = normalizeThickness(vals[2]);
                const top = normalizeThickness(bottomVals[0]);
                if (bottom && top && bottom !== top) {
                    warn = true;
                    break;
                }
            }
        }
    }
    if (!warn && templateRowIndex >= 0) {
        for (const { cell, row } of cellList) {
            if (row === templateRowIndex) {
                const vals = getThickness(/** @type {Element} */(cell));
                const top = normalizeThickness(vals[0]);
                const bottom = normalizeThickness(vals[2]);
                if (top && bottom && top !== bottom) {
                    warn = true;
                    break;
                }
            }
        }
    }
    if (warn) {
        warnWithLocation(diagnostics, originalXml, node, [
            "隣接セル間の罫線について、太さの設定が衝突している箇所があります。",
            "帳票エンジンの挙動変更に伴い、描画結果が変化している可能性があります。",
            "実際のPDF出力を目視で確認し、必要に応じてレイアウトXMLを手動で調整してください。"
        ]);
    }
}

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} node
 * @param {string} originalXml
 */
function traverse(diagnostics, node, originalXml) {
    if (node.tagName === "Grid") {
        checkGridNode(diagnostics, node, originalXml);
    } else if (node.tagName === "Table") {
        checkTableNode(diagnostics, node, originalXml);
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                traverse(diagnostics, /** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * Grid/Table の隣接セル罫線の競合を検出し警告を出す
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument?.documentElement) return;
    traverse(diagnostics, originalDocument.documentElement, originalXml);
}
