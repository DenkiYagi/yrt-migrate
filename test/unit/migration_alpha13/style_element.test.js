import { migrate } from "../../../src/migration_alpha13/style_element.mjs";

describe("style_element", () => {
    it("GridStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="red" foreach="item"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect(migrated.layouts[0]).toContain('rangeStyle="style-1"');
        expect(migrated.layouts[0]).not.toContain("<GridStyle");
        const gridMatch = migrated.layouts[0].match(/<Grid\b([^>]*)>/);
        expect(gridMatch).not.toBeNull();
        const attrs = gridMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(attrs).not.toContain("foreach");
        expect((migrated.style ?? "")).toContain('key="style-1"');
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="red" foreach="item"');
    });

    it("GridStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="red" col="1" row="2"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="red" col="1" row="2"');
    });

    it("TableStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Table>',
            '    <TableStyle borderColor="blue"/>',
            '    <TableColumn>',
            '      <TableColumnTemplate>',
            '        <Text>row</Text>',
            '      </TableColumnTemplate>',
            '    </TableColumn>',
            '  </Table>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect(migrated.layouts[0]).toContain('rangeStyle="style-1"');
        expect(migrated.layouts[0]).not.toContain("<TableStyle");
        const tableMatch = migrated.layouts[0].match(/<Table\b([^>]*)>/);
        expect(tableMatch).not.toBeNull();
        const attrs = tableMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect((migrated.style ?? "")).toContain('key="style-1"');
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="blue"');
    });

    it("TableStyleのcol/row範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Table>',
            '    <TableStyle borderColor="blue" col="1" row="2"/>',
            '    <TableColumn>',
            '      <TableColumnTemplate>',
            '        <Text>row</Text>',
            '      </TableColumnTemplate>',
            '    </TableColumn>',
            '  </Table>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="blue" col="1" row="2"');
    });

    it("ColumnTextStyle要素がStyle XMLに移行し、レイアウトXMLから削除される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="green"/>',
            '    <ColumnTextContent>abc</ColumnTextContent>',
            '  </ColumnText>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect(migrated.layouts[0]).toContain('rangeStyle="style-1"');
        expect(migrated.layouts[0]).not.toContain("<ColumnTextStyle");
        const colMatch = migrated.layouts[0].match(/<ColumnText\b([^>]*)>/);
        expect(colMatch).not.toBeNull();
        const attrs = colMatch[1];
        expect(attrs).not.toContain("borderColor");
        expect(migrated.layouts[0]).toContain("abc");
        expect((migrated.style ?? "")).toContain('key="style-1"');
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="green"');
    });

    it("ColumnTextStyleのcol範囲指定がCellRangeに正しく移行される", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="green" col="2"/>',
            '    <ColumnTextContent>abc</ColumnTextContent>',
            '  </ColumnText>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="green" col="2"');
    });

    it("GridStyle削除後に余分な空行が残らない (先頭要素)", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderThickness="1" />',
            '    <GridCell>',
            '      <Text>cell content</Text>',
            '    </GridCell>',
            '  </Grid>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        const layoutLines = migrated.layouts[0].split('\n');
        const gridLineIndex = layoutLines.findIndex(line => line.includes('<Grid '));
        const gridCellLineIndex = layoutLines.findIndex(line => line.includes('<GridCell'));
        expect(gridLineIndex).toBeGreaterThan(-1);
        expect(gridCellLineIndex).toBeGreaterThan(gridLineIndex);
        const betweenLines = layoutLines.slice(gridLineIndex + 1, gridCellLineIndex);
        expect(betweenLines.some(line => line.trim() === '')).toBe(false);
    });

    it("GridStyle削除後に余分な空行が残らない (中間要素)", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridCell name="before">',
            '      <Text>before</Text>',
            '    </GridCell>',
            '    <GridStyle borderThickness="1" />',
            '    <GridCell name="after">',
            '      <Text>after</Text>',
            '    </GridCell>',
            '  </Grid>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        const layoutLines = migrated.layouts[0].split('\n');
        const firstCellIndex = layoutLines.findIndex(line => line.includes('GridCell name="before"'));
        const secondCellIndex = layoutLines.findIndex(line => line.includes('GridCell name="after"'));
        expect(firstCellIndex).toBeGreaterThan(-1);
        expect(secondCellIndex).toBeGreaterThan(firstCellIndex);
        const betweenLines = layoutLines.slice(firstCellIndex + 1, secondCellIndex);
        expect(betweenLines.some(line => line.trim() === '')).toBe(false);
    });

    it("複数のXxxStyle要素が複数レイアウトXMLに存在した場合に、1つのスタイルXMLに正しく集約される", () => {
        const inputXmls = [
            [
                '<StackLayout>',
                '  <Grid>',
                '    <GridStyle borderColor="red"/>',
                '    <Text>test</Text>',
                '  </Grid>',
                '</StackLayout>'].join('\n'),
            [
                '<StackLayout>',
                '  <Table>',
                '    <TableStyle borderColor="blue"/>',
                '    <TableColumn>',
                '      <TableColumnTemplate>',
                '        <Text>row</Text>',
                '      </TableColumnTemplate>',
                '    </TableColumn>',
                '  </Table>',
                '</StackLayout>'].join('\n'),
        ];
        const yrtDocument = {
            layouts: [
                inputXmls[0],
                inputXmls[1]
            ], style: null
        };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect(migrated.layouts[0]).toContain('rangeStyle="style-1"');
        expect(migrated.layouts[0]).not.toContain("<GridStyle");
        expect(migrated.layouts[1]).toContain('rangeStyle="style-2"');
        expect(migrated.layouts[1]).not.toContain("<TableStyle");
        expect((migrated.style ?? "")).toContain('<CellRangeList key="style-1"');
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="red"');
        expect((migrated.style ?? "")).toContain('<CellRangeList key="style-2"');
        expect((migrated.style ?? "")).toContain('<CellRange borderColor="blue"');
        expect(((migrated.style ?? "").match(/<Style\b>/g) || []).length).toBe(1);
    });

    it("同一親要素内に複数のXxxStyle要素が存在した場合に、1つの親に対して複数のCellRange要素が正しく移行される", () => {
        const input = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="red" col="1" row="1"/>',
            '    <GridStyle borderColor="blue" col="2" row="2"/>',
            '    <GridStyle borderColor="green" col="3" row="3"/>',
            '    <Text>test</Text>',
            '  </Grid>',
            '</StackLayout>'].join('\n');
        const expectedStyle = '<Style><CellRangeList key="style-1"><CellRange borderColor="red" col="1" row="1"/><CellRange borderColor="blue" col="2" row="2"/><CellRange borderColor="green" col="3" row="3"/></CellRangeList></Style>';
        const yrtDocument = { layouts: [input], style: null };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect(migrated.layouts[0]).not.toContain("<GridStyle");
        expect(migrated.layouts[0]).toContain('rangeStyle="');
        expect((migrated.style ?? "")).toBe(expectedStyle);
    });

    describe("CellRange col/raw 必須化", () => {
        it("GridStyleにcol/row属性がない場合、CellRangeに col=\"all\" row=\"all\" が自動追加される", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<StackLayout>',
                '  <Grid>',
                '    <GridStyle borderColor="red" foreach="item"/>',
                '    <Text>test</Text>',
                '  </Grid>',
                '</StackLayout>'].join('\n');
            const yrtDocument = { layouts: [inputXml], style: null };
            const migrated = migrate(yrtDocument);
            expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
            expect((migrated.style ?? "")).toContain('<CellRange borderColor="red" foreach="item" col="all" row="all"');
        });

        it("TableStyleにcol属性のみがない場合、CellRangeに col=\"all\" が自動追加される", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<StackLayout>',
                '  <Table>',
                '    <TableStyle borderColor="blue" row="1"/>',
                '    <TableColumn>',
                '      <TableColumnTemplate>',
                '        <Text>row</Text>',
                '      </TableColumnTemplate>',
                '    </TableColumn>',
                '  </Table>',
                '</StackLayout>'].join('\n');
            const yrtDocument = { layouts: [inputXml], style: null };
            const migrated = migrate(yrtDocument);
            expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
            expect((migrated.style ?? "")).toContain('<CellRange borderColor="blue" row="1" col="all"');
        });

        it("ColumnTextStyleにrow属性のみがない場合でも、CellRangeに row=\"all\" は追加されない", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<StackLayout>',
                '  <ColumnText>',
                '    <ColumnTextStyle borderColor="green" col="2"/>',
                '    <ColumnTextContent>abc</ColumnTextContent>',
                '  </ColumnText>',
                '</StackLayout>'].join('\n');
            const yrtDocument = { layouts: [inputXml], style: null };
            const migrated = migrate(yrtDocument);
            expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
            expect((migrated.style ?? "")).toContain('<CellRange borderColor="green" col="2"');
        });

        it("既にcol/row属性が存在する場合は上書きされない", () => {
            const inputXml = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<StackLayout>',
                '  <Grid>',
                '    <GridStyle borderColor="red" col="1" row="2"/>',
                '    <Text>test</Text>',
                '  </Grid>',
                '</StackLayout>'].join('\n');
            const yrtDocument = { layouts: [inputXml], style: null };
            const migrated = migrate(yrtDocument);
            expect((migrated.style ?? "")).toContain('<CellRange borderColor="red" col="1" row="2"');
            expect((migrated.style ?? "")).not.toContain('col="all"');
            expect((migrated.style ?? "")).not.toContain('row="all"');
        });
    });

    it('XxxStyle要素が存在しない場合はスタイル情報を生成しない', () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <LinearLayout>',
            '    <Text>test</Text>',
            '  </LinearLayout>',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [inputXml], style: null };
        const migrated = migrate(yrtDocument);
        expect(migrated.style).toBeNull();
    });

});
