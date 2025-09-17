// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

const ATTR_MAP = [
    {
        elements: ['*'],
        attr: 'margin',
        keys: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        default: '0',
        inheritable: false,
    },
    {
        elements: ['*'],
        attr: 'padding',
        keys: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
        default: '0',
        inheritable: false,
    },
    {
        elements: [
            'Table',
            'TableColumnHeader',
            'TableColumnTemplate',
            'TableColumnFooter',
            'Ellipse',
            'Rectangle'
        ],
        attr: 'borderThickness',
        keys: ['borderTopThickness', 'borderRightThickness', 'borderBottomThickness', 'borderLeftThickness'],
        default: 'regular',
        inheritable: true,
    },
    {
        elements: [
            'GridCell',
            'Grid',
            'ColumnText',
            'StackBlock',
            'LinearBlock',
            'StackLayout',
            'LinearLayout'
        ],
        attr: 'borderThickness',
        keys: ['borderTopThickness', 'borderRightThickness', 'borderBottomThickness', 'borderLeftThickness'],
        default: '0',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'borderStyle',
        keys: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
        default: 'solid',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'borderColor',
        keys: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
        default: 'black',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'outerBorderThickness',
        keys: ['outerBorderTopThickness', 'outerBorderRightThickness', 'outerBorderBottomThickness', 'outerBorderLeftThickness'],
        default: '0',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'outerBorderStyle',
        keys: ['outerBorderTopStyle', 'outerBorderRightStyle', 'outerBorderBottomStyle', 'outerBorderLeftStyle'],
        default: 'solid',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'outerBorderColor',
        keys: ['outerBorderTopColor', 'outerBorderRightColor', 'outerBorderBottomColor', 'outerBorderLeftColor'],
        default: 'black',
        inheritable: true,
    },
    {
        elements: ['*'],
        attr: 'borderRadius',
        keys: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
        default: '0',
        inheritable: false,
    },
];

/**
 * @param {Element} element
 * @param {string[]} keys
 * @returns {(string|null)[]}
 */
function getIndividualValues(element, keys) {
    return keys.map(key => {
        if (!element.attributes) return null;
        const keyLower = key.toLowerCase();
        for (let i = 0; i < element.attributes.length; i++) {
            if (element.attributes[i].name.toLowerCase() === keyLower) return element.attributes[i].value;
        }
        return null;
    });
}

/**
 * @param {Element} element
 * @param {string} base
 * @returns {string|null}
 */
function getUnifiedValue(element, base) {
    if (!element.attributes) return null;
    const baseLower = base.toLowerCase();
    for (let i = 0; i < element.attributes.length; i++) {
        if (element.attributes[i].name.toLowerCase() === baseLower) {
            return element.attributes[i].value;
        }
    }
    return null;
}

/**
 * @param {Element} element
 * @param {string[]} names
 */
function removeAttributes(element, names) {
    if (!element.attributes || !Array.isArray(names)) return;
    for (const name of names) {
        for (let i = element.attributes.length - 1; i >= 0; i--) {
            if (element.attributes[i].name === name) {
                element.removeAttribute(element.attributes[i].name);
            }
        }
    }
}

/**
 * @param {{default: string, keys: string[]}} attr
 * @param {string|null} unified
 * @param {(string|null)[]} individual
 * @returns {string[]}
 */
function mergeDirectionalValues(attr, unified, individual) {
    let merged;
    if (unified != null && unified.trim() !== '') {
        const arr = unified.trim().split(' ');
        if (arr.length === 1) {
            merged = [arr[0], arr[0], arr[0], arr[0]];
        } else if (arr.length === 2) {
            merged = [arr[0], arr[1], arr[0], arr[1]];
        } else if (arr.length === 3) {
            merged = [arr[0], arr[1], arr[2], arr[1]];
        } else if (arr.length === 4) {
            merged = [arr[0], arr[1], arr[2], arr[3]];
        } else {
            merged = [attr.default, attr.default, attr.default, attr.default];
        }
    } else {
        merged = [attr.default, attr.default, attr.default, attr.default];
    }
    // 個別値でさらに上書き（個別値がnullでない部分だけ）
    for (let i = 0; i < attr.keys.length; i++) {
        const val = individual[i];
        if (val !== null && val !== undefined && val.trim() !== '') {
            merged[i] = val;
        }
    }
    return merged;
}

/**
 * @param {Element} element
 * @param {boolean} isStyleXml
 */
function normalizeDirectionalAttrsOnElement(element, isStyleXml) {
    for (const attr of ATTR_MAP) {
        const elements = Array.isArray(attr.elements) ? attr.elements : [attr.elements];
        if (!elements.includes('*') && !elements.includes(element.tagName)) continue;
        const individual = getIndividualValues(element, attr.keys);
        const unified = getUnifiedValue(element, attr.attr);
        const hasAnyIndividual = individual.some(v => v !== null && v.trim() !== '');
        const hasUnified = unified !== null && unified.trim() !== '';
        if (!(hasAnyIndividual || hasUnified)) continue;

        // StyleXMLかつinheritable属性の場合は正規化せず警告のみ
        if (isStyleXml && attr.inheritable) {
            // key属性を該当要素、なければ親要素から取得
            let key = element.getAttribute('key');
            let parent = element.parentNode;
            while (!key && parent && parent.nodeType === 1) {
                if ('getAttribute' in parent && typeof parent.getAttribute === 'function') {
                    key = parent.getAttribute('key');
                }
                parent = parent.parentNode;
            }
            const keyInfo = key ? `key="${key}"` : '';
            const xpath = getXPath(element);
            // 簡潔な警告メッセージ
            console.warn(`[WARNING] StyleXMLのborder/outerBorder系属性（${attr.attr}）は自動変換できません。手動で修正してください。対象key: ${keyInfo}${xpath ? `, XPath: ${xpath}` : ''}`);
            continue;
        }

        removeAttributes(element, [attr.attr, ...attr.keys]);
        if (hasAnyIndividual) {
            // 個別値が1つでもあれば4方向展開してマージ
            const mergedRaw = mergeDirectionalValues(attr, unified, individual);
            const merged = mergedRaw.map((v, i) => v ?? attr.default);
            element.setAttribute(attr.attr, merged.map(s => s.trim()).join(' '));
        } else if (hasUnified) {
            // 個別値がなければ一括値をそのまま残す
            element.setAttribute(attr.attr, unified.trim());
        }
    }
}

/**
 * 方向系属性（border, margin, padding等）を一括指定・個別指定から正規化する
 * @param {string} xmlString - XML文字列
 * @returns {string} 正規化されたXML文字列
 */
function normalizeDirectionalAttrs(xmlString) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    const isStyleXml = doc.documentElement && doc.documentElement.tagName === "Style";

    /**
     * @param {Element} el
     */
    function traverseAndNormalize(el) {
        if (el.nodeType !== 1) return; // ELEMENT_NODE
        if (el.childNodes) {
            for (let i = 0; i < el.childNodes.length; i++) {
                traverseAndNormalize(/** @type {Element} */(el.childNodes[i]));
            }
        }
        normalizeDirectionalAttrsOnElement(el, isStyleXml);
    }

    traverseAndNormalize(doc.documentElement);
    return new XMLSerializer().serializeToString(doc);
}

/**
 * Grid/Tableなどの親要素のborder系属性を子要素（GridCell, TableColumnTemplate等）に継承する
 * @param {string} layoutXml - XML文字列
 * @returns {string} border属性が子要素に継承されたXML文字列
 */
function inheritParentBorderAttrs(layoutXml) {
    // レイアウト継承処理（Grid/Cell, Table/TableColumnTemplate など）
    const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
    const types = [
        {
            base: "borderThickness",
            keys: ["borderTopThickness", "borderRightThickness", "borderBottomThickness", "borderLeftThickness"],
            def: "0"
        },
        {
            base: "borderStyle",
            keys: ["borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle"],
            def: "solid"
        },
        {
            base: "borderColor",
            keys: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"],
            def: "black"
        }
    ];

    const pairs = findLayoutInheritancePairs(doc.documentElement);
    for (const { parent, child } of pairs) {
        for (const type of types) {
            if (child.getAttribute(type.base)) continue;
            // 親値
            let parentUnified = parent.getAttribute(type.base);
            let parentArr = [type.def, type.def, type.def, type.def];
            if (parentUnified) {
                const arr = parentUnified.split(" ");
                for (let i = 0; i < 4; i++) {
                    parentArr[i] = arr[i] !== undefined ? arr[i] : arr[0];
                }
            }
            // 親が関連属性（統合値または個別値）を持っていない場合はスキップ
            const parentHasAny = (parentUnified != null && parentUnified !== "") || type.keys.some(k => parent.getAttribute(k) != null && parent.getAttribute(k) !== "");
            if (!parentHasAny) continue;
            // 個別指定値
            /** @type {(string|null)[]} */
            let childArr = [null, null, null, null];
            let hasIndividual = false;
            for (let d = 0; d < 4; d++) {
                const v = child.getAttribute(type.keys[d]);
                if (v != null && v !== "") {
                    childArr[d] = v;
                    hasIndividual = true;
                }
            }
            if (hasIndividual) {
                const mergedArr = childArr.map((v, d) => (v != null ? v : parentArr[d]));
                child.setAttribute(type.base, mergedArr.join(" "));
                for (let d = 0; d < 4; d++) {
                    child.removeAttribute(type.keys[d]);
                }
                if (parentUnified) parent.removeAttribute(type.base);
            }
        }
    }
    return new XMLSerializer().serializeToString(doc);
}

/**
 * Grid/TableのouterBorder系属性を端の子要素（GridCell, TableColumnTemplate等）に伝播する
 * @param {string} layoutXml - XML文字列
 * @returns {string} outerBorder属性が端要素に割り振られたXML文字列
 */
function propagateOuterBorderToEdges(layoutXml) {
    const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
    const root = doc.documentElement;
    if (!root) return layoutXml;

    const directions = ["Top", "Right", "Bottom", "Left"];
    const types = ["Thickness", "Style", "Color"];

    /**
     * @typedef {(rowIdx: number, rows: string[], colIdx: number, cols: string[], rowspan?: number, colspan?: number) => boolean} GridEdgeCheckFn
     */
    /** @type {{Top: GridEdgeCheckFn, Bottom: GridEdgeCheckFn, Left: GridEdgeCheckFn, Right: GridEdgeCheckFn}} */
    const gridEdgeChecks = {
        Top: (rowIdx, rows, colIdx, cols, rowspan = 1, colspan = 1) => rowIdx === 0,
        Bottom: (rowIdx, rows, colIdx, cols, rowspan = 1, colspan = 1) => (rowIdx + rowspan) === rows.length,
        Left: (rowIdx, rows, colIdx, cols, rowspan = 1, colspan = 1) => colIdx === 0,
        Right: (rowIdx, rows, colIdx, cols, rowspan = 1, colspan = 1) => (colIdx + colspan) === cols.length,
    };
    /**
     * @typedef {(flag: boolean) => boolean} TableEdgeCheckFn
     */
    /** @type {{Top: TableEdgeCheckFn, Bottom: TableEdgeCheckFn, Left: TableEdgeCheckFn, Right: TableEdgeCheckFn}} */
    const tableEdgeChecks = {
        Top: (isFirst) => isFirst,
        Bottom: (isLast) => isLast,
        Left: (isColFirst) => isColFirst,
        Right: (isColLast) => isColLast,
    };
    const gridCellPairs = findLayoutInheritancePairs(root);
    for (const { parent, child: cell } of gridCellPairs) {
        if (parent.tagName === "Grid") {
            const cols = (parent.getAttribute("cols") || "").trim().split(/\s+/);
            const rows = (parent.getAttribute("rows") || "").trim().split(/\s+/);
            const colStr = cell.getAttribute("col");
            const rowStr = cell.getAttribute("row");
            if (colStr === null || rowStr === null) continue;
            const colIdx = parseInt(colStr, 10);
            const rowIdx = parseInt(rowStr, 10);
            const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
            const rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10);

            /** @type {("Top"|"Bottom"|"Left"|"Right")[]} */
            const directions = ["Top", "Bottom", "Left", "Right"];
            for (const dir of directions) {
                for (const type of types) {
                    const outerAttr = `outerBorder${dir}${type}`;
                    const cellAttr = `border${dir}${type}`;
                    const edgeResult = gridEdgeChecks[/** @type {"Top"|"Bottom"|"Left"|"Right"} */(dir)](rowIdx, rows, colIdx, cols, rowspan, colspan);
                    if (edgeResult && parent.getAttribute(outerAttr)) {
                        const val = parent.getAttribute(outerAttr);
                        if (val !== null) {
                            cell.setAttribute(cellAttr, val);
                        }
                    }
                }
            }
        } else if (parent.tagName === "Table") {
            // TableColumnTemplate, TableColumnHeader, TableColumnFooter の場合
            if (cell.parentNode && "tagName" in cell.parentNode && cell.parentNode.tagName === "TableColumn") {
                const tableColumn = cell.parentNode;
                const siblings = Array.from(tableColumn.childNodes)
                    .filter(n => n.nodeType === 1)
                    .map(n => /** @type {Element} */(n));
                const idx = siblings.indexOf(cell);
                const isFirst = idx === 0;
                const isLast = idx === siblings.length - 1;
                const tableColumns = Array.from(parent.childNodes)
                    .filter(n => n.nodeType === 1 && 'tagName' in n && n.tagName === "TableColumn")
                    .map(n => /** @type {Element} */(n));
                const colIdx = tableColumns.findIndex(col => col === tableColumn);
                const isColFirst = colIdx === 0;
                const isColLast = colIdx === tableColumns.length - 1;
                const hasHeader = siblings.some(n => n.tagName === "TableColumnHeader");
                const hasFooter = siblings.some(n => n.tagName === "TableColumnFooter");
                if (
                    cell.tagName === "TableColumnTemplate" &&
                    ((isFirst && !hasHeader) || (isLast && !hasFooter))
                ) {
                    const xpath = getXPath(cell);
                    console.warn(`[WARNING] TableColumnHeader または TableColumnFooter が存在しないため、TableColumnTemplate に outerBorder 系属性が割り振られます。繰り返し描画部分に罫線が重複する可能性があります。(${xpath})`);
                }
                // Tableの端判定と属性コピー
                for (const dir of directions) {
                    for (const type of types) {
                        const outerAttr = `outerBorder${dir}${type}`;
                        const cellAttr = `border${dir}${type}`;
                        let isEdge = false;
                        if (dir === "Top") isEdge = tableEdgeChecks.Top(isFirst);
                        if (dir === "Bottom") isEdge = tableEdgeChecks.Bottom(isLast);
                        if (dir === "Left") isEdge = tableEdgeChecks.Left(isColFirst);
                        if (dir === "Right") isEdge = tableEdgeChecks.Right(isColLast);
                        if (isEdge && parent.getAttribute(outerAttr)) {
                            const val = parent.getAttribute(outerAttr);
                            if (val !== null) cell.setAttribute(cellAttr, val);
                        }
                    }
                }
            }
            // CellRangeの場合（StyleXml内）
            if (cell.tagName === "CellRange") {
                // Table直下のCellRangeは上下左右端とみなす
                for (const dir of directions) {
                    for (const type of types) {
                        const outerAttr = `outerBorder${dir}${type}`;
                        const cellAttr = `border${dir}${type}`;
                        if (parent.getAttribute(outerAttr)) {
                            const val = parent.getAttribute(outerAttr);
                            if (val !== null) cell.setAttribute(cellAttr, val);
                        }
                    }
                }
            }
        }
    }

    // 個別指定値のouterBorder系属性はGridから削除
    for (const { parent } of gridCellPairs) {
        for (const dir of directions) {
            for (const type of types) {
                const outerAttr = `outerBorder${dir}${type}`;
                parent.removeAttribute(outerAttr);
            }
        }
    }
    return new XMLSerializer().serializeToString(doc);
}

/**
 * Grid/Tableなどの親要素と、その子孫要素（GridCell, TableColumnTemplate等）の親子ペアを抽出する
 * @param {Element} root - XMLのルート要素
 * @returns {Array<{parent: Element, child: Element}>}
 */
function findLayoutInheritancePairs(root) {
    /** @type {{parent: Element, child: Element}[]} */
    const pairs = [];
    /**
     * @param {any} node
     */
    function traverse(node) {
        if (!node || node.nodeType !== 1) return;
        // Grid > GridCell, Grid > CellRange (StyleXml)
        if (node.tagName === "Grid") {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child && child.nodeType === 1) {
                    if (child.tagName === "GridCell") {
                        pairs.push({ parent: node, child });
                    }
                    // StyleXml: Grid > CellRange
                    if (child.tagName === "CellRange") {
                        pairs.push({ parent: node, child });
                    }
                }
            }
        }
        // Table > TableColumn > TableColumn(Header|Template|Footer), Table > CellRange (StyleXml)
        if (node.tagName === "Table") {
            for (let i = 0; i < node.childNodes.length; i++) {
                const tableColumn = node.childNodes[i];
                if (tableColumn && tableColumn.nodeType === 1) {
                    if (tableColumn.tagName === "TableColumn") {
                        for (let j = 0; j < tableColumn.childNodes.length; j++) {
                            const grandChild = tableColumn.childNodes[j];
                            if (grandChild && grandChild.nodeType === 1 && (grandChild.tagName === "TableColumnTemplate" || grandChild.tagName === "TableColumnHeader" || grandChild.tagName === "TableColumnFooter")) {
                                pairs.push({ parent: node, child: grandChild });
                            }
                        }
                    }
                    // StyleXml: Table > CellRange
                    if (tableColumn.tagName === "CellRange") {
                        pairs.push({ parent: node, child: tableColumn });
                    }
                }
            }
        }
        // StyleXml: ColumnText > CellRange
        if (node.tagName === "ColumnText") {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child && child.nodeType === 1 && child.tagName === "CellRange") {
                    pairs.push({ parent: node, child });
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
            }
        }
    }
    traverse(root);
    return pairs;
}

/**
 * Grid内の兄弟セル間で4方向属性（borderThickness, borderStyle, borderColorなど）を伝播する
 * @param {string} layoutXml - XML文字列
 * @returns {string} 兄弟セル間で属性が伝播されたXML文字列
 */
export function propagateSiblingBorders(layoutXml) {
    const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
    const root = doc.documentElement;
    if (!root) return layoutXml;

    const types = [
        { base: "borderThickness", keys: ["borderTopThickness", "borderRightThickness", "borderBottomThickness", "borderLeftThickness"] },
        { base: "borderStyle", keys: ["borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle"] },
        { base: "borderColor", keys: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"] },
    ];

    /**
     * @param {Element} cell
     * @param {{base: string, keys: string[]}} type
     * @returns {(string|null)[]} 4方向のborder値配列
     */
    function expandBorderValues(cell, type) {
        /** @type {(string|null)[]} */
        let values = [null, null, null, null];
        if (cell.hasAttribute(type.base)) {
            const arr = cell.getAttribute(type.base)?.split(/\s+/) ?? [];
            if (arr.length === 1) values = [arr[0] ?? null, arr[0] ?? null, arr[0] ?? null, arr[0] ?? null];
            else if (arr.length === 2) values = [arr[0] ?? null, arr[1] ?? null, arr[0] ?? null, arr[1] ?? null];
            else if (arr.length === 3) values = [arr[0] ?? null, arr[1] ?? null, arr[2] ?? null, arr[1] ?? null];
            else if (arr.length === 4) values = [arr[0] ?? null, arr[1] ?? null, arr[2] ?? null, arr[3] ?? null];
        }
        type.keys.forEach((key, d) => {
            if (cell.hasAttribute(key)) values[d] = cell.getAttribute(key);
        });
        return values;
    }

    /**
     * @param {Element} node
     * @param {number} nRows
     * @param {number} nCols
     * @returns {Array<{cell: Element, row: number, col: number, colspan: number, rowspan: number}>}
     */
    function buildGridCellList(node, nRows, nCols) {
        const cellList = [];
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (
                child &&
                child.nodeType === 1 &&
                'tagName' in child &&
                typeof child.tagName === "string" &&
                'getAttribute' in child &&
                typeof child.getAttribute === "function" &&
                child.tagName === "GridCell"
            ) {
                const col = parseInt(child.getAttribute("col") || "0", 10);
                const row = parseInt(child.getAttribute("row") || "0", 10);
                const colspan = parseInt(child.getAttribute("colspan") || "1", 10);
                const rowspan = parseInt(child.getAttribute("rowspan") || "1", 10);
                if (!isNaN(row) && !isNaN(col) && row < nRows && col < nCols) {
                    cellList.push({ cell: /** @type {Element} */ (child), row, col, colspan, rowspan });
                }
            }
        }
        /** @type {{ cell: Element, row: number, col: number, colspan: number, rowspan: number }[]} */
        const filteredCellList = cellList
            .filter(item => 'tagName' in item.cell && typeof item.cell.tagName === 'string')
            .map(item => ({ ...item, cell: /** @type {Element} */ (item.cell) }));
        return /** @type {{ cell: Element, row: number, col: number, colspan: number, rowspan: number }[]} */ (filteredCellList);
    }

    /**
     * @param {Element} tableNode
     * @returns {{cellList: Array<{cell: Element, row: number, col: number, colspan: number, rowspan: number}>, nRows: number, nCols: number}}
     */
    function buildTableCellList(tableNode) {
        // TableColumnを左から右に並べる
        const columns = [];
        for (let i = 0; i < tableNode.childNodes.length; i++) {
            const colNode = tableNode.childNodes[i];
            if (
                colNode &&
                colNode.nodeType === 1 &&
                'tagName' in colNode &&
                colNode.tagName === "TableColumn"
            ) {
                columns.push(colNode);
            }
        }
        // 各TableColumn内でHeader,Template,Footerの順で強い
        const rowTypes = ["TableColumnHeader", "TableColumnTemplate", "TableColumnFooter"];
        // 2次元配列: [row][col] 形式でcellListを作る
        const cellList = [];
        for (let rowIdx = 0; rowIdx < rowTypes.length; rowIdx++) {
            const rowType = rowTypes[rowIdx];
            for (let colIdx = 0; colIdx < columns.length; colIdx++) {
                const colNode = columns[colIdx];
                // 優先順で最初に見つかったものを採用
                let cell = null;
                for (let t = 0; t < rowTypes.length; t++) {
                    const type = rowTypes[t];
                    for (let j = 0; j < colNode.childNodes.length; j++) {
                        const child = colNode.childNodes[j];
                        if (child && child.nodeType === 1 && 'tagName' in child && child.tagName === type) {
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
        /** @type {{ cell: Element, row: number, col: number, colspan: number, rowspan: number }[]} */
        const filteredCellList = cellList
            .filter(item => 'tagName' in item.cell && typeof item.cell.tagName === 'string')
            .map(item => ({ ...item, cell: /** @type {Element} */ (item.cell) }));
        return { cellList: /** @type {{ cell: Element, row: number, col: number, colspan: number, rowspan: number }[]} */ (filteredCellList), nRows: rowTypes.length, nCols: columns.length };
    }

    /**
     * @param {Array<{cell: Element, row: number, col: number, colspan: number, rowspan: number}>} cellList
     * @param {number} nRows
     * @param {number} nCols
     * @returns {Object<string, {top: any[][], bottom: any[][], left: any[][], right: any[][]}>}
     */
    function buildBoxLineModel(cellList, nRows, nCols) {
        /** @type {{ [key: string]: { top: any[][], bottom: any[][], left: any[][], right: any[][] } }} */
        const borderLines = {};
        for (const type of types) {
            borderLines[type.base] = {
                top: Array.from({ length: nRows + 1 }, () => Array(nCols).fill(null)),
                bottom: Array.from({ length: nRows + 1 }, () => Array(nCols).fill(null)),
                left: Array.from({ length: nRows }, () => Array(nCols + 1).fill(null)),
                right: Array.from({ length: nRows }, () => Array(nCols + 1).fill(null)),
            };
        }

        // 主要4方向のセット
        /**
         * @param {{top: any[][], bottom: any[][], left: any[][], right: any[][]}} border
         * @param {(string|null)[]} values
         * @param {number} r
         * @param {number} c
         * @param {number} dr
         * @param {number} dc
         * @param {number} rowspan
         * @param {number} colspan
         */
        function setMainDirections(border, values, r, c, dr, dc, rowspan, colspan) {
            // top
            if (values[0] != null) border.top[r][c] ??= values[0];
            // left
            if (values[3] != null) border.left[r][c] ??= values[3];
            // right（セルの右端のみ）
            if (values[1] != null && dc === colspan - 1) border.right[r][c + 1] ??= values[1];
            // bottom（セルの下端のみ）
            if (values[2] != null && dr === rowspan - 1) border.bottom[r + 1][c] ??= values[2];
        }

        // 隣接セルとの間の境界（adjacent）セット
        /**
         * @param {{top: any[][], bottom: any[][], left: any[][], right: any[][]}} border
         * @param {(string|null)[]} values
         * @param {number} r
         * @param {number} c
         * @param {number} nRows
         * @param {number} nCols
         */
        function setAdjacentBorders(border, values, r, c, nRows, nCols) {
            // 左隣セルの右罫線
            if (values[3] != null && c > 0) border.right[r][c] ??= values[3];
            // 右隣セルの左罫線
            if (values[1] != null && c < nCols) border.left[r][c + 1] ??= values[1];
            // 上隣セルの下罫線
            if (values[0] != null && r > 0) border.bottom[r][c] ??= values[0];
            // 下隣セルの上罫線
            if (values[2] != null && r < nRows) border.top[r + 1][c] ??= values[2];
        }

        for (const { cell, row, col, colspan, rowspan } of cellList) {
            for (const type of types) {
                const values = expandBorderValues(cell, type);
                // このセルが占有する全ての座標を事前展開
                for (let dr = 0; dr < rowspan; dr++) {
                    for (let dc = 0; dc < colspan; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        setMainDirections(borderLines[type.base], values, r, c, dr, dc, rowspan, colspan);
                        setAdjacentBorders(borderLines[type.base], values, r, c, nRows, nCols);
                    }
                }
            }
        }
        return borderLines;
    }

    /**
     * @param {Array<{cell: Element, row: number, col: number, colspan: number, rowspan: number}>} cellList
     * @param {Object<string, {top: any[][], bottom: any[][], left: any[][], right: any[][]}>} borderLines
     * @param {number} nRows
     * @param {number} nCols
     */
    function reflectBoxLineToCells(cellList, borderLines, nRows, nCols) {
        /**
         * @typedef {Object} BorderLineMatrix
         * @property {any[][]} top
         * @property {any[][]} bottom
         * @property {any[][]} left
         * @property {any[][]} right
         */
        /**
         * @typedef {(border: BorderLineMatrix, row: number, col: number, colspan: number, rowspan: number, nRows: number, nCols: number) => any} BorderLineGetValueFn
         */

        /**
         * @type {Array<{name: string, keyIdx: number, getValue: BorderLineGetValueFn}>}
         */
        const directions = [
            {
                name: "top",
                keyIdx: 0,
                getValue: (border, row, col, colspan, rowspan, nRows, nCols) => {
                    let v = border.top[row][col];
                    if (row > 0) v = border.bottom[row][col] ?? v;
                    return v;
                },
            },
            {
                name: "right",
                keyIdx: 1,
                getValue: (border, row, col, colspan, rowspan, nRows, nCols) => {
                    let v = border.right[row][col + colspan];
                    if (col + colspan < nCols) v = border.left[row][col + colspan] ?? v;
                    return v;
                },
            },
            {
                name: "bottom",
                keyIdx: 2,
                getValue: (border, row, col, colspan, rowspan, nRows, nCols) => {
                    let v = border.bottom[row + rowspan][col];
                    if (row + rowspan < nRows) v = border.top[row + rowspan][col] ?? v;
                    return v;
                },
            },
            {
                name: "left",
                keyIdx: 3,
                getValue: (border, row, col, colspan, rowspan, nRows, nCols) => {
                    let v = border.left[row][col];
                    if (col > 0) v = border.right[row][col] ?? v;
                    return v;
                },
            },
        ];
        for (const { cell, row, col, colspan = 1, rowspan = 1 } of cellList) {
            for (const type of types) {
                if (cell.hasAttribute(type.base)) continue;
                const hasAny = type.keys.some(key => cell.hasAttribute(key));
                if (!hasAny) continue;
                for (const dir of directions) {
                    const key = type.keys[dir.keyIdx];
                    if (!cell.hasAttribute(key)) {
                        const v = dir.getValue(borderLines[type.base], row, col, colspan, rowspan, nRows, nCols);
                        v != null ? cell.setAttribute(key, v) : cell.removeAttribute(key);
                    }
                }
            }
        }
    }

    /**
     * @param {Element | ChildNode | null | undefined} node
     */
    function traverse(node) {
        if (!node || node.nodeType !== 1) return;
        // 型ガード
        if ('tagName' in node && typeof node.tagName === 'string') {
            if (node.tagName === "Grid") {
                const cols = (node.getAttribute("cols") || "").trim().split(/\s+/);
                const rows = (node.getAttribute("rows") || "").trim().split(/\s+/);
                const nCols = cols.length, nRows = rows.length;
                const cellList = buildGridCellList(/** @type {Element} */(node), nRows, nCols);
                const borderLines = buildBoxLineModel(cellList, nRows, nCols);
                reflectBoxLineToCells(cellList, borderLines, nRows, nCols);
            }
            if (node.tagName === "Table") {
                const { cellList, nRows, nCols } = buildTableCellList(/** @type {Element} */(node));
                if (cellList.length > 0) {
                    const borderLines = buildBoxLineModel(cellList, nRows, nCols);
                    reflectBoxLineToCells(cellList, borderLines, nRows, nCols);
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
            }
        }
    }
    traverse(root);
    return new XMLSerializer().serializeToString(doc);
}

/**
 * レイアウトXMLに方向系属性の正規化・継承・伝播処理を適用する
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const nextLayouts = yrtDocument.layouts.map(entry => {
        if (!entry || typeof entry.xml !== 'string') return entry;
        let xml = entry.xml;
        xml = propagateOuterBorderToEdges(xml);
        xml = inheritParentBorderAttrs(xml);
        xml = propagateSiblingBorders(xml);
        xml = normalizeDirectionalAttrs(xml);
        return { ...entry, xml };
    });
    // Style XMLにも同様の処理を適用
    let nextStyle = yrtDocument.style;
    if (typeof nextStyle === 'string' && nextStyle.trim().length > 0) {
        let styleXml = nextStyle;
        styleXml = normalizeDirectionalAttrs(styleXml);
        nextStyle = styleXml;
    }
    return { ...yrtDocument, layouts: nextLayouts, style: nextStyle };
}
