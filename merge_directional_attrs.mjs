import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const ATTR_MAP = [
    {
        base: 'margin',
        keys: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        default: '0',
    },
    {
        base: 'padding',
        keys: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
        default: '0',
    },
    {
        base: 'borderThickness',
        keys: ['borderTopThickness', 'borderRightThickness', 'borderBottomThickness', 'borderLeftThickness'],
        default: '0',
    },
    {
        base: 'borderStyle',
        keys: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
        default: 'solid',
    },
    {
        base: 'borderColor',
        keys: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
        default: 'black',
    },
    {
        base: 'outerBorderThickness',
        keys: ['outerBorderTopThickness', 'outerBorderRightThickness', 'outerBorderBottomThickness', 'outerBorderLeftThickness'],
        default: '0',
    },
    {
        base: 'outerBorderStyle',
        keys: ['outerBorderTopStyle', 'outerBorderRightStyle', 'outerBorderBottomStyle', 'outerBorderLeftStyle'],
        default: 'solid',
    },
    {
        base: 'outerBorderColor',
        keys: ['outerBorderTopColor', 'outerBorderRightColor', 'outerBorderBottomColor', 'outerBorderLeftColor'],
        default: 'black',
    },
    {
        base: 'borderRadius',
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
        for (let i = 0; i < element.attributes.length; i++) {
            if (element.attributes[i].name === key) return element.attributes[i].value;
        }
        return null;
    });
}

function getUnifiedValue(element, base) {
    if (!element.attributes) return null;
    const target = base.toLowerCase();
    for (let i = 0; i < element.attributes.length; i++) {
        const attrName = element.attributes[i].name.toLowerCase();
        if (attrName === target) {
            return element.attributes[i].value;
        }
    }
    return null;
}

function mergeValues(attr, unified, individual) {
    let merged = [];
    if (unified !== null && unified.trim() !== '') {
        const arr = unified.split(' ');
        for (let i = 0; i < attr.keys.length; i++) {
            merged[i] = arr[i] !== undefined ? arr[i] : arr[0];
        }
    } else {
        for (let i = 0; i < attr.keys.length; i++) {
            merged[i] = attr.default;
        }
    }
    for (let i = 0; i < attr.keys.length; i++) {
        if (individual[i] !== null && individual[i].trim() !== '') merged[i] = individual[i];
    }
    for (let i = 0; i < attr.keys.length; i++) {
        if (!merged[i]) merged[i] = attr.default;
    }
    return merged;
}

function removeDirectionalAttributes(element, attr) {
    removeAttributeByName(element, attr.base, true);
    for (const indivKey of attr.keys) {
        removeAttributeByName(element, indivKey);
    }
}

function mergeDirectionalAttributes(element) {
    for (const attr of ATTR_MAP) {
        const individual = getIndividualValues(element, attr.keys);
        const unified = getUnifiedValue(element, attr.base);
        const hasAnyIndividual = individual.some(v => v !== null && v.trim() !== '');
        if (!hasAnyIndividual) continue;
        const merged = mergeValues(attr, unified, individual);
        if (isAllDefaultOrEmpty(merged, attr.default)) {
            removeDirectionalAttributes(element, attr);
            continue;
        }
        removeDirectionalAttributes(element, attr);
        element.setAttribute(attr.base, merged.map(s => s.trim()).join(' '));
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

export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    const layouts = yrtRoot[2].l.map(layout => {
        if (!layout) return layout;
        // [null, xmlString] 形式の場合は2番目のみ変換
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            const doc = new DOMParser().parseFromString(layout[1], "text/xml");
            traverseAndMerge(doc.documentElement);
            return [null, new XMLSerializer().serializeToString(doc)];
        } else if (typeof layout === "string") {
            const doc = new DOMParser().parseFromString(layout, "text/xml");
            traverseAndMerge(doc.documentElement);
            return new XMLSerializer().serializeToString(doc);
        }
        return layout;
    });
    const next = [yrtRoot[0], yrtRoot[1], { ...yrtRoot[2], l: layouts }];
    return next;
}
