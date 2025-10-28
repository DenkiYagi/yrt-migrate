// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

const FN_LIKE_TOKEN = /^\s*(\S*\([^()]*\)\S*)/;
const SIMPLE_TOKEN = /^\s*(\S+)/;

/**
 * 括弧を含むトークンを1単位で扱いながら空白区切りを行う。
 * @param {string} value
 * @returns {string[]}
 */
function splitDirectionalAttrValues(value) {
    /** @type {string[]} */
    const tokens = [];
    let rest = value.trim();
    while (rest.length > 0) {
        const fnMatch = rest.match(FN_LIKE_TOKEN);
        if (fnMatch) {
            tokens.push(fnMatch[1]);
            rest = rest.slice(fnMatch[0].length);
            continue;
        }
        const simpleMatch = rest.match(SIMPLE_TOKEN);
        if (simpleMatch) {
            tokens.push(simpleMatch[1]);
            rest = rest.slice(simpleMatch[0].length);
            continue;
        }
        break;
    }
    return tokens;
}

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
 * Grid/Table要素が「隣接セルの罫線挙動警告」対象なら警告を出す
 * @param {string} xmlString - XML文字列
 * @param {string} [originalXml] - 元XML
 */
export function warnForAdjacentBorders(xmlString, originalXml) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    if (!doc.documentElement || doc.documentElement.nodeType !== 1) return;
    const borderTypes = [
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

    // Grid/Tableノードに対して警告ロジックを適用
    /**
     * @param {Element} node
     */
    function checkNodeForAdjacentBorders(node) {
        if (node.tagName === "Grid") {
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
                    'tagName' in child &&
                    typeof child.tagName === "string" &&
                    'getAttribute' in child &&
                    typeof child.getAttribute === "function" &&
                    child.tagName === "GridCell"
                ) {
                    const el = /** @type {Element} */ (child);
                    const col = parseInt(el.getAttribute("col") || "0", 10);
                    const row = parseInt(el.getAttribute("row") || "0", 10);
                    const colspan = parseInt(el.getAttribute("colspan") || "1", 10);
                    const rowspan = parseInt(el.getAttribute("rowspan") || "1", 10);
                    if (!isNaN(row) && !isNaN(col) && row < nRows && col < nCols) {
                        cellList.push({ cell: /** @type {Element} */ (el), row, col, colspan, rowspan });
                    }
                }
            }
            // 隣接セル同士でborder系属性が衝突しているか
            let warn = false;
            // 横方向（右隣）
            for (const type of borderTypes) {
                for (const { cell, row, col, colspan, rowspan } of cellList) {
                    // 右隣セルを探す
                    const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
                    if (rightCell) {
                        const vals = expandBorderValues(/** @type {Element} */(cell), type);
                        const rightVals = expandBorderValues(/** @type {Element} */(rightCell.cell), type);
                        // 自セルの右と右隣セルの左
                        if (vals[1] !== '_' && rightVals[3] !== '_' && vals[1] !== '' && rightVals[3] !== '') {
                            // どちらも指定あり
                            warn = true;
                        }
                    }
                }
            }
            // 縦方向（下隣）
            for (const type of borderTypes) {
                for (const { cell, row, col, colspan, rowspan } of cellList) {
                    const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
                    if (bottomCell) {
                        const vals = expandBorderValues(/** @type {Element} */(cell), type);
                        const bottomVals = expandBorderValues(/** @type {Element} */(bottomCell.cell), type);
                        // 自セルの下と下隣セルの上
                        if (vals[2] !== '_' && bottomVals[0] !== '_' && vals[2] !== '' && bottomVals[0] !== '') {
                            warn = true;
                        }
                    }
                }
            }
            if (warn) {
                warnWithLocation(originalXml ?? '', node, "隣接セルの罫線挙動が変わる可能性があります。必要に応じて手動で直してください。");
            }
        } else if (node.tagName === "Table") {
            const columns = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                const colNode = node.childNodes[i];
                if (
                    colNode &&
                    colNode.nodeType === 1 &&
                    'tagName' in colNode &&
                    colNode.tagName === "TableColumn"
                ) {
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
            let warn = false;
            // 横方向（右隣）
            for (const type of borderTypes) {
                for (const { cell, row, col, colspan, rowspan } of cellList) {
                    const rightCell = cellList.find(c => c.row === row && c.col === col + colspan);
                    if (rightCell) {
                        const vals = expandBorderValues(/** @type {Element} */(cell), type);
                        const rightVals = expandBorderValues(/** @type {Element} */(rightCell.cell), type);
                        if (vals[1] !== '_' && rightVals[3] !== '_' && vals[1] !== '' && rightVals[3] !== '') {
                            warn = true;
                        }
                    }
                }
            }
            // 縦方向（下隣）
            for (const type of borderTypes) {
                for (const { cell, row, col, colspan, rowspan } of cellList) {
                    const bottomCell = cellList.find(c => c.col === col && c.row === row + rowspan);
                    if (bottomCell) {
                        const vals = expandBorderValues(/** @type {Element} */(cell), type);
                        const bottomVals = expandBorderValues(/** @type {Element} */(bottomCell.cell), type);
                        if (vals[2] !== '_' && bottomVals[0] !== '_' && vals[2] !== '' && bottomVals[0] !== '') {
                            warn = true;
                        }
                    }
                }
            }
            if (warn) {
                warnWithLocation(originalXml ?? '', node, "隣接セルの罫線挙動が変わる可能性があります。必要に応じて手動で直してください。");
            }
        }
    }

    // 再帰的に全ノードを走査
    /**
     * @param {Element} node
     */
    function traverseAll(node) {
        if (!node || node.nodeType !== 1) return;
        checkNodeForAdjacentBorders(node);
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                traverseAll(/** @type {Element} */(node.childNodes[i]));
            }
        }
    }

    traverseAll(doc.documentElement);
}

/**
 * 4方向属性を一括で正規化し、未指定部分を _ で埋める
 * @param {string} xmlString - XML文字列
 * @returns {string} - 正規化されたXML文字列
 */
export function normalizeDirectionalAttrsUnderscore(xmlString) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    /**
     * @param {Element} el
     */
    function processElement(el) {
        if (el.nodeType !== 1) return;
        // 1. 変換前の属性名・値・グループを順序通りに保持
        /** @type {{ name: string, value: string, group: string|null }[]} */
        const beforeAttrs = [];
        for (let i = 0; i < el.attributes.length; i++) {
            const name = el.attributes[i].name;
            const value = el.attributes[i].value;
            // どのATTR_MAPグループか
            let group = null;
            for (const attr of ATTR_MAP) {
                if (attr.attr === name || attr.keys.includes(name)) {
                    group = attr.attr;
                    break;
                }
            }
            beforeAttrs.push({ name, value, group });
        }

        // 2. グループごとに統合値を計算
        /** @type {Map<string, {unified: string, used: boolean}>} */
        const groupUnified = new Map();
        for (const attr of ATTR_MAP) {
            // そのグループに属する属性を全部集める
            const unified = el.getAttribute(attr.attr);
            const individual = attr.keys.map(k => el.getAttribute(k));
            const hasAny = (unified && unified.trim() !== '') || individual.some(v => v != null && v.trim() !== '');
            if (!hasAny) continue;
            // もともと単一値指定＋個別値未指定なら何もしない
            if (unified && unified.trim() !== '' && individual.every(v => v == null || v.trim() === '') && !unified.trim().includes(' ')) {
                continue;
            }
            let arr = unified ? splitDirectionalAttrValues(unified) : [];
            if (arr.length === 1) arr = [arr[0], arr[0], arr[0], arr[0]];
            else if (arr.length === 2) arr = [arr[0], arr[1], arr[0], arr[1]];
            else if (arr.length === 3) arr = [arr[0], arr[1], arr[2], arr[1]];
            else if (arr.length === 4) arr = [arr[0], arr[1], arr[2], arr[3]];
            else arr = ['', '', '', ''];
            for (let i = 0; i < 4; i++) {
                const indiv = individual[i] ?? '';
                if (indiv.trim() !== '') {
                    arr[i] = indiv;
                }
            }
            for (let i = 0; i < 4; i++) {
                if (arr[i] == null || arr[i].trim() === '') {
                    arr[i] = '_';
                }
            }
            arr = arr.map(s => (typeof s === 'string' ? s.trim() : s));
            let outVal;
            if (arr.every(v => v === arr[0])) {
                outVal = arr[0];
            } else {
                outVal = arr.join(' ');
            }
            outVal = (typeof outVal === 'string') ? outVal.replace(/\s+/g, ' ').trim() : outVal;
            groupUnified.set(attr.attr, { unified: outVal, used: false });
        }

        // 3. 変換対象属性を一通り削除
        for (const attr of ATTR_MAP) {
            el.removeAttribute(attr.attr);
            for (const k of attr.keys) el.removeAttribute(k);
        }

        // 4. beforeAttrsの順序で変換後属性を追加
        for (const { name, value, group } of beforeAttrs) {
            if (group && groupUnified.has(group)) {
                const gu = groupUnified.get(group);
                if (gu && !gu.used) {
                    // グループの最初の出現位置で統合属性を出力
                    el.setAttribute(group, gu.unified);
                    gu.used = true;
                }
            } else if (!group || !groupUnified.has(group)) {
                // 4方向属性グループでないものはそのまま
                el.setAttribute(name, value);
            }
            // それ以外（グループの2回目以降）はスキップ
        }

        // 5. 新規追加属性（元に存在しなかった統合属性）は末尾に追加
        for (const [group, gu] of groupUnified) {
            if (!gu.used) {
                el.setAttribute(group, gu.unified);
            }
        }

        // 6. 子要素も再帰
        if (el.childNodes) {
            for (let i = 0; i < el.childNodes.length; i++) {
                processElement(/** @type {Element} */(el.childNodes[i]));
            }
        }
    }
    if (doc.documentElement) {
        processElement(doc.documentElement);
    }
    return new XMLSerializer().serializeToString(doc);
}

/**
 * レイアウトXMLに方向系属性の正規化・継承・伝播処理を適用する
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml - 元のYRT XML文字列
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const nextLayouts = yrtDocument.layouts.map(entry => {
        if (!entry || typeof entry.xml !== 'string') return entry;
        let xml = entry.xml;
        warnForAdjacentBorders(xml, originalXml);
        xml = normalizeDirectionalAttrsUnderscore(xml);
        return { ...entry, xml };
    });
    // Style XMLにも同様の処理を適用
    let nextStyle = yrtDocument.style;
    if (typeof nextStyle === 'string' && nextStyle.trim().length > 0) {
        let styleXml = nextStyle;
        warnForAdjacentBorders(styleXml, originalXml);
        styleXml = normalizeDirectionalAttrsUnderscore(styleXml);
        nextStyle = styleXml;
    }
    return { ...yrtDocument, layouts: nextLayouts, style: nextStyle };
}
