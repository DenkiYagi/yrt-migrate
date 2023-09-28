import xpath from 'xpath'

export function splitAttributeValue(value) {
    const result = value.match(/_|[\w+-,.]+(\((\s|[\w+-,.])*\))?/g);
    if (result) {
        return result;
    } else {
        return [];
    }
}

function setAttributeIfNotEmpty(node, attr, value) {
    if (!value || value === "_") return;
    node.setAttribute(attr, value);
}

function convert(node, attrName, attr1, attr2, attr3, attr4) {
    const attrValue = node.getAttribute(attrName);
    if (!attrValue) return;

    const values = splitAttributeValue(attrValue);
    if (!values.includes("_")) return;

    const length = values.length;
    if (length == "1") {
        node.removeAttribute(attrName);
        setAttributeIfNotEmpty(node, attr1, values[0]);
        setAttributeIfNotEmpty(node, attr2, values[0]);
        setAttributeIfNotEmpty(node, attr3, values[0]);
        setAttributeIfNotEmpty(node, attr4, values[0]);
    } else if (length == "2") {
        node.removeAttribute(attrName);
        setAttributeIfNotEmpty(node, attr1, values[0]);
        setAttributeIfNotEmpty(node, attr2, values[1]);
        setAttributeIfNotEmpty(node, attr3, values[0]);
        setAttributeIfNotEmpty(node, attr4, values[1]);
    } else if (length == "3") {
        node.removeAttribute(attrName);
        setAttributeIfNotEmpty(node, attr1, values[0]);
        setAttributeIfNotEmpty(node, attr2, values[1]);
        setAttributeIfNotEmpty(node, attr3, values[2]);
        setAttributeIfNotEmpty(node, attr4, values[1]);
    } else if (length == "4") {
        node.removeAttribute(attrName);
        setAttributeIfNotEmpty(node, attr1, values[0]);
        setAttributeIfNotEmpty(node, attr2, values[1]);
        setAttributeIfNotEmpty(node, attr3, values[2]);
        setAttributeIfNotEmpty(node, attr4, values[3]);
    }
}

function convertAttribute(doc, expression, attrName, attr1, attr2, attr3, attr4) {
    const result = xpath.select(expression, doc);
    if (xpath.isArrayOfNodes(result)) {
        for (let i = 0; i < result.length; i++) {
            convert(result[i], attrName, attr1, attr2, attr3, attr4);
        }
    } else if(xpath.isNodeLike(result)) {
        convert(result, attrName, attr1, attr2, attr3, attr4);
    }
}

function convertOuterBorderThickness(doc, expression) {
    convertAttribute(doc, expression, "outerBorderThickness",
        "outerBorderTopThickness", "outerBorderRightThickness", "outerBorderBottomThickness", "outerBorderLeftThickness");
}

function convertOuterBorderColor(doc, expression) {
    convertAttribute(doc, expression, "outerBorderColor",
        "outerBorderTopColor", "outerBorderRightColor", "outerBorderBottomColor", "outerBorderLeftColor");
}

function convertOuterBorderStyle(doc, expression) {
    convertAttribute(doc, expression, "outerBorderStyle",
        "outerBorderTopStyle", "outerBorderRightStyle", "outerBorderBottomStyle", "outerBorderLeftStyle");
}

function convertBorderThickness(doc, expression) {
    convertAttribute(doc, expression, "borderThickness",
        "borderTopThickness", "borderRightThickness", "borderBottomThickness", "borderLeftThickness");
}

function convertBorderColor(doc, expression) {
    convertAttribute(doc, expression, "outerBorderColor",
        "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor");
}

function convertBorderStyle(doc, expression) {
    convertAttribute(doc, expression, "outerBorderStyle",
        "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle");
}

export function migrate(doc) {
    convertOuterBorderThickness(doc, "//Grid");
    convertOuterBorderColor(doc, "//Grid");
    convertOuterBorderStyle(doc, "//Grid");

    convertBorderThickness(doc, "//GridCell");
    convertBorderColor(doc, "//GridCell");
    convertBorderStyle(doc, "//GridCell");

    convertOuterBorderThickness(doc, "//GridStyle");
    convertOuterBorderColor(doc, "//GridStyle");
    convertOuterBorderStyle(doc, "//GridStyle");

    convertOuterBorderThickness(doc, "//Table");
    convertOuterBorderColor(doc, "//Table");
    convertOuterBorderStyle(doc, "//Table");

    convertOuterBorderThickness(doc, "//TableStyle");
    convertOuterBorderColor(doc, "//TableStyle");
    convertOuterBorderStyle(doc, "//TableStyle");

    convertOuterBorderThickness(doc, "//ColumnText");
    convertOuterBorderColor(doc, "//ColumnText");
    convertOuterBorderStyle(doc, "//ColumnText");
}
