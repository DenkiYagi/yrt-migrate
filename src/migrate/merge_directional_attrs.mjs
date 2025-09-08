// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

const ATTR_MAP = [
    {
        elements: ['*'],
        attr: 'margin',
        keys: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        default: '0',
    },
    {
        elements: ['*'],
        attr: 'padding',
        keys: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
        default: '0',
    },
    {
        elements: ['Table', 'Ellipse', 'Rectangle'],
        attr: 'borderThickness',
        keys: ['borderTopThickness', 'borderRightThickness', 'borderBottomThickness', 'borderLeftThickness'],
        default: 'regular',
    },
    {
        elements: ['Grid', 'ColumnText', 'StackBlock', 'LinearBlock', 'StackLayout', 'LinearLayout'],
        attr: 'borderThickness',
        keys: ['borderTopThickness', 'borderRightThickness', 'borderBottomThickness', 'borderLeftThickness'],
        default: '0',
    },
    {
        elements: ['*'],
        attr: 'borderStyle',
        keys: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
        default: 'solid',
    },
    {
        elements: ['*'],
        attr: 'borderColor',
        keys: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
        default: 'black',
    },
    {
        elements: ['*'],
        attr: 'outerBorderThickness',
        keys: ['outerBorderTopThickness', 'outerBorderRightThickness', 'outerBorderBottomThickness', 'outerBorderLeftThickness'],
        default: '0',
    },
    {
        elements: ['*'],
        attr: 'outerBorderStyle',
        keys: ['outerBorderTopStyle', 'outerBorderRightStyle', 'outerBorderBottomStyle', 'outerBorderLeftStyle'],
        default: 'solid',
    },
    {
        elements: ['*'],
        attr: 'outerBorderColor',
        keys: ['outerBorderTopColor', 'outerBorderRightColor', 'outerBorderBottomColor', 'outerBorderLeftColor'],
        default: 'black',
    },
    {
        elements: ['*'],
        attr: 'borderRadius',
        keys: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'],
        default: '0',
    },
];

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
        if (individual[i] !== null && individual[i].trim() !== '') {
            merged[i] = individual[i];
        }
    }
    return merged;
}

function normalizeDirectionalAttrsOnElement(element) {
    for (const attr of ATTR_MAP) {
        const elements = Array.isArray(attr.elements) ? attr.elements : [attr.elements];
        if (!elements.includes('*') && !elements.includes(element.tagName)) continue;
        const individual = getIndividualValues(element, attr.keys);
        const unified = getUnifiedValue(element, attr.attr);
        const hasAnyIndividual = individual.some(v => v !== null && v.trim() !== '');
        const hasUnified = unified !== null && unified.trim() !== '';
        if (!(hasAnyIndividual || hasUnified)) continue;
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

    function traverseAndNormalize(el) {
        if (el.nodeType !== 1) return; // ELEMENT_NODE
        if (el.childNodes) {
            for (let i = 0; i < el.childNodes.length; i++) {
                traverseAndNormalize(el.childNodes[i]);
            }
        }
        normalizeDirectionalAttrsOnElement(el);
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

    // 端判定関数
    const gridEdgeChecks = {
        Top: (rowIdx, rows, colIdx, cols) => rowIdx === 0,
        Right: (rowIdx, rows, colIdx, cols) => colIdx === cols.length - 1,
        Bottom: (rowIdx, rows, colIdx, cols) => rowIdx === rows.length - 1,
        Left: (rowIdx, rows, colIdx, cols) => colIdx === 0,
    };
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
            for (const dir of directions) {
                for (const type of types) {
                    const outerAttr = `outerBorder${dir}${type}`;
                    const cellAttr = `border${dir}${type}`;
                    if (gridEdgeChecks[dir](rowIdx, rows, colIdx, cols) && parent.getAttribute(outerAttr)) {
                        const val = parent.getAttribute(outerAttr);
                        if (val !== null) cell.setAttribute(cellAttr, val);
                    }
                }
            }
        } else if (parent.tagName === "Table") {
            const tableColumn = cell.parentNode;
            if (!tableColumn || !("tagName" in tableColumn) || tableColumn.tagName !== "TableColumn") continue;
            const siblings = Array.from(tableColumn.childNodes)
                .filter(n => n.nodeType === 1)
                .map(n => /** @type {Element} */(n));
            const idx = siblings.indexOf(cell);
            const isFirst = idx === 0;
            const isLast = idx === siblings.length - 1;
            const tableColumns = Array.from(parent.childNodes)
                .filter(n => n.nodeType === 1 && n["tagName"] === "TableColumn")
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
    const pairs = [];
    function traverse(node) {
        if (!node || node.nodeType !== 1) return;
        // Grid > GridCell
        if (node.tagName === "Grid") {
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child && child.nodeType === 1 && child.tagName === "GridCell") {
                    pairs.push({ parent: node, child });
                }
            }
        }
        // Table > TableColumn > TableColumn(Header|Template|Footer)
        if (node.tagName === "Table") {
            for (let i = 0; i < node.childNodes.length; i++) {
                const tableColumn = node.childNodes[i];
                if (tableColumn && tableColumn.nodeType === 1 && tableColumn.tagName === "TableColumn") {
                    for (let j = 0; j < tableColumn.childNodes.length; j++) {
                        const grandChild = tableColumn.childNodes[j];
                        if (grandChild && grandChild.nodeType === 1 && (grandChild.tagName === "TableColumnTemplate" || grandChild.tagName === "TableColumnHeader" || grandChild.tagName === "TableColumnFooter")) {
                            pairs.push({ parent: node, child: grandChild });
                        }
                    }
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
        xml = normalizeDirectionalAttrs(xml);
        return { ...entry, xml };
    });
    // Style XMLにも同様の処理を適用
    let nextStyle = yrtDocument.style;
    if (typeof nextStyle === 'string' && nextStyle.trim().length > 0) {
        let styleXml = nextStyle;
        styleXml = propagateOuterBorderToEdges(styleXml);
        styleXml = inheritParentBorderAttrs(styleXml);
        styleXml = normalizeDirectionalAttrs(styleXml);
        nextStyle = styleXml;
    }
    return { ...yrtDocument, layouts: nextLayouts, style: nextStyle };
}
