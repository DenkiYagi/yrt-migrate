import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

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

function removeAttributeByName(element, name, ignoreCase = false) {
    if (!element.attributes) return;
    for (let i = element.attributes.length - 1; i >= 0; i--) {
        if (ignoreCase) {
            if (element.attributes[i].name.toLowerCase() === name.toLowerCase()) {
                element.removeAttribute(element.attributes[i].name);
            }
        } else {
            if (element.attributes[i].name === name) {
                element.removeAttribute(element.attributes[i].name);
            }
        }
    }
}

function isAllDefaultOrEmpty(values, def) {
    return values.every(v => v === def || v === '' || v == null);
}

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

function mergeValues(attr, unified, individual) {
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

function removeDirectionalAttributes(element, attr) {
    removeAttributeByName(element, attr.attr, true);
    for (const indivKey of attr.keys) {
        removeAttributeByName(element, indivKey);
    }
}

function mergeDirectionalAttributes(element) {
    for (const attr of ATTR_MAP) {
        // elements指定がワイルドカードまたは一致する場合のみ処理
        const elements = Array.isArray(attr.elements) ? attr.elements : [attr.elements];
        if (!elements.includes('*') && !elements.includes(element.tagName)) continue;
        const individual = getIndividualValues(element, attr.keys);
        const unified = getUnifiedValue(element, attr.attr);
        const hasAnyIndividual = individual.some(v => v !== null && v.trim() !== '');
        const hasUnified = unified !== null && unified.trim() !== '';
        // 個別属性または一括指定値が1つでもあれば必ず統合処理を行う
        if (!(hasAnyIndividual || hasUnified)) continue;
        const mergedRaw = mergeValues(attr, unified, individual);
        // 未指定方向をATTR_MAPのデフォルト値で埋める
        const merged = mergedRaw.map((v, i) => v ?? attr.default);
        if (isAllDefaultOrEmpty(merged, attr.default)) {
            removeDirectionalAttributes(element, attr);
            continue;
        }
        removeDirectionalAttributes(element, attr);
        element.setAttribute(attr.attr, merged.map(s => s.trim()).join(' '));
    }
}


function traverseAndMerge(el) {
    if (el.nodeType !== 1) return; // ELEMENT_NODE
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            traverseAndMerge(el.childNodes[i]);
        }
    }
    mergeDirectionalAttributes(el);
}

export function mergeDirectionalAttrsInXml(xmlString) {
    const doc = new DOMParser().parseFromString(xmlString, "text/xml");
    traverseAndMerge(doc.documentElement);
    return new XMLSerializer().serializeToString(doc);
}

export function preprocessGridCellInheritance(layoutXml) {
    // Grid→GridCellの4方向属性（borderThickness, borderStyle, borderColorなど）をすべて継承・統合
    const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
    const grid = doc.documentElement;
    if (!grid || grid.tagName !== "Grid") return layoutXml;

    // borderThickness のみ継承
    const attr = "borderThickness";
    const keys = ["borderTopThickness", "borderRightThickness", "borderBottomThickness", "borderLeftThickness"];
    const def = "0";

    let gridUnified = grid.getAttribute(attr);
    let gridArr = [def, def, def, def];
    if (gridUnified) {
        const arr = gridUnified.split(" ");
        for (let i = 0; i < 4; i++) {
            gridArr[i] = arr[i] !== undefined ? arr[i] : arr[0];
        }
    }
    let gridAttrShouldRemove = false;
    for (let i = 0; i < grid.childNodes.length; i++) {
        const cell = grid.childNodes[i];
        if (!cell || cell.nodeType !== 1 || cell.tagName !== "GridCell") continue;
        // GridCellに一括指定値があれば何もしない
        if (cell.getAttribute(attr)) continue;
        // GridCellに個別値があればGridの一括指定値とマージ
        let hasIndividual = false;
        let cellArr = gridArr.slice();
        for (let d = 0; d < 4; d++) {
            const v = cell.getAttribute(keys[d]);
            if (v != null && v !== "") {
                cellArr[d] = v;
                hasIndividual = true;
            }
        }
        if (hasIndividual && gridUnified) {
            // Gridの一括指定値と個別値をマージしてGridCellにセット
            cell.setAttribute(attr, cellArr.join(" "));
            // 個別属性削除
            for (let d = 0; d < 4; d++) {
                cell.removeAttribute(keys[d]);
            }
            gridAttrShouldRemove = true;
        }
        // 個別値のみの場合や何もない場合は何もしない
    }
    // Gridの属性は渡した場合のみ削除
    if (gridAttrShouldRemove) {
        grid.removeAttribute(attr);
    }
    return new XMLSerializer().serializeToString(doc);
}

/**
 * Gridのouter方向属性（Thickness, Style, Color）をGridCellの対応する方向属性に割り振る
 * @param {string} layoutXml - XML文字列
 * @returns {string} - 変換後XML文字列
 */
export function assignOuterBorderDirectionalAttributes(layoutXml) {
    const doc = new DOMParser().parseFromString(layoutXml, "text/xml");
    const grid = doc.documentElement;
    if (!grid || grid.tagName !== "Grid") return layoutXml;

    // 方向と属性種別
    const directions = ["Top", "Right", "Bottom", "Left"];
    const types = ["Thickness", "Style", "Color"];

    // GridCellの位置判定用
    // cols, rows: スペース区切りで数値配列
    const cols = (grid.getAttribute("cols") || "").trim().split(/\s+/);
    const rows = (grid.getAttribute("rows") || "").trim().split(/\s+/);

    // outerXxx系属性をGridCellのxxx個別属性へ変換・付与のみ
    for (let i = 0; i < grid.childNodes.length; i++) {
        const cell = grid.childNodes[i];
        if (!cell || cell.nodeType !== 1 || cell.tagName !== "GridCell") continue;
        const colIdx = parseInt(cell.getAttribute("col"), 10);
        const rowIdx = parseInt(cell.getAttribute("row"), 10);
        // 端判定
        const isTop = rowIdx === 0;
        const isBottom = rowIdx === rows.length - 1;
        const isLeft = colIdx === 0;
        const isRight = colIdx === cols.length - 1;

        // outerBorderThickness → borderTopThickness/borderRightThickness/...
        if (isTop && grid.getAttribute("outerBorderTopThickness")) {
            cell.setAttribute("borderTopThickness", grid.getAttribute("outerBorderTopThickness"));
        }
        if (isRight && grid.getAttribute("outerBorderRightThickness")) {
            cell.setAttribute("borderRightThickness", grid.getAttribute("outerBorderRightThickness"));
        }
        if (isBottom && grid.getAttribute("outerBorderBottomThickness")) {
            cell.setAttribute("borderBottomThickness", grid.getAttribute("outerBorderBottomThickness"));
        }
        if (isLeft && grid.getAttribute("outerBorderLeftThickness")) {
            cell.setAttribute("borderLeftThickness", grid.getAttribute("outerBorderLeftThickness"));
        }

        // outerBorderColor → borderTopColor/borderRightColor/...
        if (isTop && grid.getAttribute("outerBorderTopColor")) {
            cell.setAttribute("borderTopColor", grid.getAttribute("outerBorderTopColor"));
        }
        if (isRight && grid.getAttribute("outerBorderRightColor")) {
            cell.setAttribute("borderRightColor", grid.getAttribute("outerBorderRightColor"));
        }
        if (isBottom && grid.getAttribute("outerBorderBottomColor")) {
            cell.setAttribute("borderBottomColor", grid.getAttribute("outerBorderBottomColor"));
        }
        if (isLeft && grid.getAttribute("outerBorderLeftColor")) {
            cell.setAttribute("borderLeftColor", grid.getAttribute("outerBorderLeftColor"));
        }

        // outerBorderStyle → borderTopStyle/borderRightStyle/...
        if (isTop && grid.getAttribute("outerBorderTopStyle")) {
            cell.setAttribute("borderTopStyle", grid.getAttribute("outerBorderTopStyle"));
        }
        if (isRight && grid.getAttribute("outerBorderRightStyle")) {
            cell.setAttribute("borderRightStyle", grid.getAttribute("outerBorderRightStyle"));
        }
        if (isBottom && grid.getAttribute("outerBorderBottomStyle")) {
            cell.setAttribute("borderBottomStyle", grid.getAttribute("outerBorderBottomStyle"));
        }
        if (isLeft && grid.getAttribute("outerBorderLeftStyle")) {
            cell.setAttribute("borderLeftStyle", grid.getAttribute("outerBorderLeftStyle"));
        }
    }
    // outerBorder系属性はGridから削除
    for (const dir of directions) {
        for (const type of types) {
            const outerAttr = `outerBorder${dir}${type}`;
            grid.removeAttribute(outerAttr);
        }
    }
    // outerBorder系属性はGridから削除
    for (const dir of directions) {
        for (const type of types) {
            const outerAttr = `outerBorder${dir}${type}`;
            grid.removeAttribute(outerAttr);
        }
    }
    return new XMLSerializer().serializeToString(doc);
}


export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    const layouts = yrtRoot[2].l.map(layout => {
        if (!layout) return layout;
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            let xml = layout[1];
            xml = assignOuterBorderDirectionalAttributes(xml);
            xml = preprocessGridCellInheritance(xml);
            xml = mergeDirectionalAttrsInXml(xml);
            return [null, xml];
        } else if (typeof layout === "string") {
            let xml = layout;
            xml = assignOuterBorderDirectionalAttributes(xml);
            xml = preprocessGridCellInheritance(xml);
            xml = mergeDirectionalAttrsInXml(xml);
            return xml;
        }
        return layout;
    });
    const next = [yrtRoot[0], yrtRoot[1], { ...yrtRoot[2], l: layouts }];
    return next;
}
