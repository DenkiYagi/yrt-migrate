import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { migrate } from "./style_element.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("style_element", () => {
    it("GridStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid>\n    <GridStyle borderColor=\"red\" foreach=\"item\"/>\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts, styleXml } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('style="styleelement-1"');
        expect(layouts[0]).not.toContain("<GridStyle");
        const gridMatch = layouts[0].match(/<Grid([^>]*)>/);
        expect(gridMatch).not.toBeNull();
        const attrs = gridMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(attrs).not.toContain("foreach");
        expect(styleXml).toContain('key="styleelement-1"');
        expect(styleXml).toContain(
            '<CellRange borderColor="red" foreach="item"'
        );
    });

    it("GridStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid>\n    <GridStyle borderColor=\"red\" col=\"1\" row=\"2\"/>\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        expect(yrt[2].s).toContain(
            '<CellRange borderColor="red" col="1" row="2"'
        );
    });

    it("TableStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Table>\n    <TableStyle borderColor=\"blue\"/>\n    <TableColumn>\n      <TableColumnTemplate>\n        <Text>row</Text>\n      </TableColumnTemplate>\n    </TableColumn>\n  </Table>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts, styleXml } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('style="styleelement-1"');
        expect(layouts[0]).not.toContain("<TableStyle");
        const tableMatch = layouts[0].match(/<Table([^>]*)>/);
        expect(tableMatch).not.toBeNull();
        const attrs = tableMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(styleXml).toContain('key="styleelement-1"');
        expect(styleXml).toContain('<CellRange borderColor="blue"');
    });

    it("TableStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Table>\n    <TableStyle borderColor=\"blue\" col=\"1\" row=\"2\"/>\n    <TableColumn>\n      <TableColumnTemplate>\n        <Text>row</Text>\n      </TableColumnTemplate>\n    </TableColumn>\n  </Table>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        expect(yrt[2].s).toContain(
            '<CellRange borderColor="blue" col="1" row="2"'
        );
    });



    it("ColumnTextStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<LayoutXml>\n  <ColumnText>\n    <ColumnTextStyle borderColor=\"green\"/>\n    <ColumnTextContent>abc</ColumnTextContent>\n  </ColumnText>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts, styleXml } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('style="styleelement-1"');
        expect(layouts[0]).not.toContain("<ColumnTextStyle");
        const colMatch = layouts[0].match(/<ColumnText([^>]*)>/);
        expect(colMatch).not.toBeNull();
        const attrs = colMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(layouts[0]).toContain("abc");
        expect(styleXml).toContain('key="styleelement-1"');
        expect(styleXml).toContain('<CellRange borderColor="green"');
    });

    it("ColumnTextStyleのcol範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <ColumnText>\n    <ColumnTextStyle borderColor=\"green\" col=\"2\"/>\n    <ColumnTextContent>abc</ColumnTextContent>\n  </ColumnText>\n</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        expect(yrt[2].s).toContain('<CellRange borderColor="green" col="2"');
    });

    it("複数のXxxStyle要素が複数レイアウトXMLに存在した場合に、1つのスタイルXMLに正しく集約される", () => {
        // 2つのレイアウトXML（Grid, Table）にそれぞれXxxStyleがあるケース
        const inputXmls = [
            `<?xml version="1.0" encoding="UTF-8"?>\n<Grid>\n  <GridStyle borderColor="red"/>\n  <Text>test</Text>\n</Grid>`,
            `<?xml version="1.0" encoding="UTF-8"?>\n<Table>\n  <TableStyle borderColor="blue"/>\n  <TableColumn>\n    <TableColumnTemplate>\n      <Text>row</Text>\n    </TableColumnTemplate>\n  </TableColumn>\n</Table>`,
        ];
        const yrt = migrate(toYrtRoot({ layouts: inputXmls }));
        const { layouts, styleXml } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('style="styleelement-1"');
        expect(layouts[0]).not.toContain("<GridStyle");
        expect(layouts[1]).toContain('style="styleelement-2"');
        expect(layouts[1]).not.toContain("<TableStyle");
        expect(styleXml).toContain('<Grid key="styleelement-1"');
        expect(styleXml).toContain('<CellRange borderColor="red"');
        expect(styleXml).toContain('<Table key="styleelement-2"');
        expect(styleXml).toContain('<CellRange borderColor="blue"');
        expect((styleXml.match(/<Style>/g) || []).length).toBe(1);
    });
});
