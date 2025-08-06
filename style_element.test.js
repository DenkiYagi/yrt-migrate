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

    it("同一親要素内に複数のXxxStyle要素が存在した場合に、すべてが正しく移行される", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
  <Grid>
    <GridStyle borderColor="red" col="1" row="1"/>
    <GridStyle borderColor="blue" col="2" row="2"/>
    <GridStyle borderColor="green" col="3" row="3"/>
    <Text>test</Text>
  </Grid>
</LayoutXml>`;
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts, styleXml } = fromYrtRoot(yrt);

        // レイアウトXMLから全てのGridStyleが削除されていることを確認
        expect(layouts[0]).not.toContain("<GridStyle");

        // Style XMLに3つのGrid要素が追加されていることを確認
        expect((styleXml.match(/<Grid/g) || []).length).toBe(3);
        expect(styleXml).toContain('<Grid key="styleelement-1"');
        expect(styleXml).toContain('<Grid key="styleelement-2"');
        expect(styleXml).toContain('<Grid key="styleelement-3"');

        // 各CellRangeが正しく設定されていることを確認
        expect(styleXml).toContain('<CellRange borderColor="red" col="1" row="1"');
        expect(styleXml).toContain('<CellRange borderColor="blue" col="2" row="2"');
        expect(styleXml).toContain('<CellRange borderColor="green" col="3" row="3"');
    });

    describe("CellRange col/raw 必須化", () => {
        it("GridStyleにcol/row属性がない場合、CellRangeに col=\"all\" row=\"all\" が自動追加される", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid>\n    <GridStyle borderColor=\"red\" foreach=\"item\"/>\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>`;
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { styleXml } = fromYrtRoot(yrt);
            expect(styleXml).toContain('<CellRange borderColor="red" foreach="item" col="all" row="all"');
        });

        it("TableStyleにcol属性のみがない場合、CellRangeに col=\"all\" が自動追加される", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Table>\n    <TableStyle borderColor=\"blue\" row=\"1\"/>\n    <TableColumn>\n      <TableColumnTemplate>\n        <Text>row</Text>\n      </TableColumnTemplate>\n    </TableColumn>\n  </Table>\n</LayoutXml>`;
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { styleXml } = fromYrtRoot(yrt);
            expect(styleXml).toContain('<CellRange borderColor="blue" row="1" col="all"');
        });

        it("ColumnTextStyleにrow属性のみがない場合、CellRangeに row=\"all\" が自動追加される", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <ColumnText>\n    <ColumnTextStyle borderColor=\"green\" col=\"2\"/>\n    <ColumnTextContent>abc</ColumnTextContent>\n  </ColumnText>\n</LayoutXml>`;
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { styleXml } = fromYrtRoot(yrt);
            expect(styleXml).toContain('<CellRange borderColor="green" col="2" row="all"');
        });

        it("既にcol/row属性が存在する場合は上書きされない", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid>\n    <GridStyle borderColor=\"red\" col=\"1\" row=\"2\"/>\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>`;
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { styleXml } = fromYrtRoot(yrt);
            expect(styleXml).toContain('<CellRange borderColor="red" col="1" row="2"');
            expect(styleXml).not.toContain('col="all"');
            expect(styleXml).not.toContain('row="all"');
        });
    });
});
