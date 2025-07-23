import xmlFormat from "xml-formatter";

export function formatXml(xml) {
    // xml-formatter を使って2スペースインデントで整形
    return xmlFormat(xml, { indentation: "  " });
}
