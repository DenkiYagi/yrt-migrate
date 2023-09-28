import xpath from 'xpath'

export function splitAttributeValue(value) {
    const result = value.match(/_|[\w+-,.]+(\((\s|[\w+-,.])*\))?/g);
    if (result) {
        return result;
    } else {
        return [];
    }
}

export function migrate(doc) {
    const nodes = xpath.select("//Grid", doc);
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.setAttribute("hoge", "piyo");
        node.removeAttribute("rows");
    }
}
