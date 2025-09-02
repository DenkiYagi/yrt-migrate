import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/style_element.mjs";

describe("style_element", () => {
    it("GridStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Grid>',
            '    <GridStyle borderColor="red" foreach="item"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.layouts[0].xml).toContain('style="styleelement-1"');
        expect(migrated.layouts[0].xml).not.toContain("<GridStyle");
        const gridMatch = migrated.layouts[0].xml.match(/<Grid([^>]*)>/);
        expect(gridMatch).not.toBeNull();
        const attrs = gridMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(attrs).not.toContain("foreach");
        expect(migrated.style).toContain('key="styleelement-1"');
        expect(migrated.style).toContain('<CellRange borderColor="red" foreach="item"');
    });

    it("GridStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Grid>',
            '    <GridStyle borderColor="red" col="1" row="2"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.style).toContain('<CellRange borderColor="red" col="1" row="2"');
    });

    it("TableStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Table>',
            '    <TableStyle borderColor="blue"/>',
            '    <TableColumn>',
            '      <TableColumnTemplate>',
            '        <Text>row</Text>',
            '      </TableColumnTemplate>',
            '    </TableColumn>',
            '  </Table>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.layouts[0].xml).toContain('style="styleelement-1"');
        expect(migrated.layouts[0].xml).not.toContain("<TableStyle");
        const tableMatch = migrated.layouts[0].xml.match(/<Table([^>]*)>/);
        expect(tableMatch).not.toBeNull();
        const attrs = tableMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(migrated.style).toContain('key="styleelement-1"');
        expect(migrated.style).toContain('<CellRange borderColor="blue"');
    });

    it("TableStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Table>',
            '    <TableStyle borderColor="blue" col="1" row="2"/>',
            '    <TableColumn>',
            '      <TableColumnTemplate>',
            '        <Text>row</Text>',
            '      </TableColumnTemplate>',
            '    </TableColumn>',
            '  </Table>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.style).toContain('<CellRange borderColor="blue" col="1" row="2"');
    });

    it("ColumnTextStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="green"/>',
            '    <ColumnTextContent>abc</ColumnTextContent>',
            '  </ColumnText>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.layouts[0].xml).toContain('style="styleelement-1"');
        expect(migrated.layouts[0].xml).not.toContain("<ColumnTextStyle");
        const colMatch = migrated.layouts[0].xml.match(/<ColumnText([^>]*)>/);
        expect(colMatch).not.toBeNull();
        const attrs = colMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(migrated.layouts[0].xml).toContain("abc");
        expect(migrated.style).toContain('key="styleelement-1"');
        expect(migrated.style).toContain('<CellRange borderColor="green"');
    });

    it("ColumnTextStyleのcol範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="green" col="2"/>',
            '    <ColumnTextContent>abc</ColumnTextContent>',
            '  </ColumnText>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.style).toContain('<CellRange borderColor="green" col="2"');
    });

    it("複数のXxxStyle要素が複数レイアウトXMLに存在した場合に、1つのスタイルXMLに正しく集約される", () => {
        const inputXmls = [
            [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<Grid>',
                '  <GridStyle borderColor="red"/>',
                '  <Text>test</Text>',
                '</Grid>'
            ].join('\n'),
            [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<Table>',
                '  <TableStyle borderColor="blue"/>',
                '  <TableColumn>',
                '    <TableColumnTemplate>',
                '      <Text>row</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n'),
        ];
        const yrtDocument = {
            layouts: [
                { name: null, xml: inputXmls[0] },
                { name: null, xml: inputXmls[1] }
            ], style: null, assets: null
        };
        const migrated = migrate(yrtDocument);
        expect(migrated.layouts[0].xml).toContain('style="styleelement-1"');
        expect(migrated.layouts[0].xml).not.toContain("<GridStyle");
        expect(migrated.layouts[1].xml).toContain('style="styleelement-2"');
        expect(migrated.layouts[1].xml).not.toContain("<TableStyle");
        expect(migrated.style).toContain('<Grid key="styleelement-1"');
        expect(migrated.style).toContain('<CellRange borderColor="red"');
        expect(migrated.style).toContain('<Table key="styleelement-2"');
        expect(migrated.style).toContain('<CellRange borderColor="blue"');
        expect((migrated.style.match(/<Style>/g) || []).length).toBe(1);
    });

    it("同一親要素内に複数のXxxStyle要素が存在した場合に、すべてが正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Grid>',
            '    <GridStyle borderColor="red" col="1" row="1"/>',
            '    <GridStyle borderColor="blue" col="2" row="2"/>',
            '    <GridStyle borderColor="green" col="3" row="3"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.layouts[0].xml).not.toContain("<GridStyle");
        expect((migrated.style.match(/<Grid/g) || []).length).toBe(3);
        expect(migrated.style).toContain('<Grid key="styleelement-1"');
        expect(migrated.style).toContain('<Grid key="styleelement-2"');
        expect(migrated.style).toContain('<Grid key="styleelement-3"');
        expect(migrated.style).toContain('<CellRange borderColor="red" col="1" row="1"');
        expect(migrated.style).toContain('<CellRange borderColor="blue" col="2" row="2"');
        expect(migrated.style).toContain('<CellRange borderColor="green" col="3" row="3"');
    });

    describe("CellRange col/raw 必須化", () => {
        it("GridStyleにcol/row属性がない場合、CellRangeに col=\"all\" row=\"all\" が自動追加される", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<LayoutXml>',
                '  <Grid>',
                '    <GridStyle borderColor="red" foreach="item"/>',
                '    <Text>test</Text>',
                '  </Grid>',
                '</LayoutXml>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            expect(migrated.style).toContain('<CellRange borderColor="red" foreach="item" col="all" row="all"');
        });

        it("TableStyleにcol属性のみがない場合、CellRangeに col=\"all\" が自動追加される", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<LayoutXml>',
                '  <Table>',
                '    <TableStyle borderColor="blue" row="1"/>',
                '    <TableColumn>',
                '      <TableColumnTemplate>',
                '        <Text>row</Text>',
                '      </TableColumnTemplate>',
                '    </TableColumn>',
                '  </Table>',
                '</LayoutXml>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            expect(migrated.style).toContain('<CellRange borderColor="blue" row="1" col="all"');
        });

        it("ColumnTextStyleにrow属性のみがない場合、CellRangeに row=\"all\" が自動追加される", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<LayoutXml>',
                '  <ColumnText>',
                '    <ColumnTextStyle borderColor="green" col="2"/>',
                '    <ColumnTextContent>abc</ColumnTextContent>',
                '  </ColumnText>',
                '</LayoutXml>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            expect(migrated.style).toContain('<CellRange borderColor="green" col="2" row="all"');
        });

        it("既にcol/row属性が存在する場合は上書きされない", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<LayoutXml>',
                '  <Grid>',
                '    <GridStyle borderColor="red" col="1" row="2"/>',
                '    <Text>test</Text>',
                '  </Grid>',
                '</LayoutXml>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            expect(migrated.style).toContain('<CellRange borderColor="red" col="1" row="2"');
            expect(migrated.style).not.toContain('col="all"');
            expect(migrated.style).not.toContain('row="all"');
        });
    });

    it('XxxStyle要素が存在しない場合はスタイル情報を生成しない', () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <LinearLayout>',
            '    <Text>test</Text>',
            '  </LinearLayout>',
            '</LayoutXml>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        expect(!migrated.style || migrated.style.trim() === '').toBe(true);
    });

    it("XxxStyle要素の属性にバインド変数が含まれる場合、StyleXMLに移行しつつ警告が出る", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <Grid>',
            '    <GridStyle borderColor="${foo}" foreach="${foo}"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</LayoutXml>'
        ].join('\n');
        const spy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const cellRangeMatch = migrated.style.match(/<CellRange[^>]*>/);
        expect(cellRangeMatch).not.toBeNull();
        const cellRangeTag = cellRangeMatch[0];
        expect(cellRangeTag).toContain('borderColor="${foo}"');
        expect(cellRangeTag).toContain('foreach="${foo}"');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
