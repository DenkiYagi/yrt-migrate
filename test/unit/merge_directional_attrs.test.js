import { describe, it } from '@jest/globals';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { migrate } from '../../src/migrate/merge_directional_attrs.mjs';
import { migrate as colorNotationMigrate } from '../../src/migrate/color_notation_illustrator.mjs';

/**
 * XML文字列をDOMで正規化して返す
 */
function normalizeXml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return new XMLSerializer().serializeToString(doc.documentElement);
}

describe('mergeDirectionalAttributes', () => {
    describe('レイアウト系 XML の単一要素内での解決', () => {
        it('margin の統合', () => {
            const input = '<StackLayout marginTop="1" marginRight="2" marginBottom="3" marginLeft="4"/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('margin の統合（値に前後空白あり）', () => {
            const input = '<StackLayout marginTop=" 1 " marginRight=" 2 " marginBottom=" 3 " marginLeft=" 4 "/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor の統合', () => {
            const input = '<LinearLayout borderTopColor="#111" borderRightColor="#222" borderBottomColor="#333" borderLeftColor="#444"/>';
            const expected = '<LinearLayout borderColor="#111 #222 #333 #444"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor の rgb() 単一値は括弧内空白を保持したまま統合される', () => {
            const input = '<LinearBlock borderColor="rgb(1, 0, 1)"/>';
            const expected = '<LinearBlock borderColor="rgb(1, 0, 1)"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor の rgb() 4値は各値を崩さず統合される', () => {
            const input = '<LinearBlock borderColor="rgb(1, 0, 1)   rgb(0, 1, 0)  rgb(0, 0, 1) rgb(1, 1, 1)"/>';
            const expected = '<LinearBlock borderColor="rgb(1, 0, 1) rgb(0, 1, 0) rgb(0, 0, 1) rgb(1, 1, 1)"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor の rgb() 多値はカラー変換ステップまで保持され正しく変換される', () => {
            const input = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <LinearBlock borderColor="rgb(1, 0, 1) rgb(0, 1, 0) rgb(0, 0, 1) rgb(0.5, 0.5, 0.5)"/>',
                '  </LayoutBody>',
                '</LinearLayout>',].join('');
            const yrtDocument = { layouts: [input], style: null };
            const merged = migrate(yrtDocument);
            const colored = colorNotationMigrate(merged);
            expect(colored.layouts[0]).toContain('borderColor="R100G0B100 R0G100B0 R0G0B100 R50G50B50"');
        });

        it('borderStyle の統合', () => {
            const input = '<Grid borderTopStyle="solid" borderRightStyle="dashed" borderBottomStyle="dotted" borderLeftStyle="double"/>';
            const expected = '<Grid borderStyle="solid dashed dotted double"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderThickness の統合', () => {
            const input = '<Table outerBorderTopThickness="1" outerBorderRightThickness="2" outerBorderBottomThickness="3" outerBorderLeftThickness="4"/>';
            const expected = '<Table outerBorderThickness="1 2 3 4"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderColor の統合', () => {
            const input = '<Table outerBorderTopColor="#111" outerBorderRightColor="#222" outerBorderBottomColor="#333" outerBorderLeftColor="#444"/>';
            const expected = '<Table outerBorderColor="#111 #222 #333 #444"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderStyle の統合', () => {
            const input = '<Table outerBorderTopStyle="solid" outerBorderRightStyle="dashed" outerBorderBottomStyle="dotted" outerBorderLeftStyle="double"/>';
            const expected = '<Table outerBorderStyle="solid dashed dotted double"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderRadius の統合', () => {
            const input = '<Rectangle borderTopLeftRadius="4" borderTopRightRadius="6" borderBottomRightRadius="8" borderBottomLeftRadius="10"/>';
            const expected = '<Rectangle borderRadius="4 6 8 10"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderThickness の統合', () => {
            const input = '<LinearLayout borderTopThickness="1" borderRightThickness="2" borderBottomThickness="3" borderLeftThickness="4"/>';
            const expected = '<LinearLayout borderThickness="1 2 3 4"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('上下のみ指定した場合は4値で補完しつつ、足りない部分を _ で補完する', () => {
            const input = '<StackLayout paddingTop="8" paddingBottom="8"/>';
            const expected = '<StackLayout padding="8 _ 8 _"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('一括指定値と個別指定値があった場合は、一括指定値を個別指定値で上書きする', () => {
            const input = '<Grid borderThickness="5" borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="5 5 5 2"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('すでに統合済みの場合は何もしない', () => {
            const input = '<Table margin="2 4 2 4"/>';
            const expected = '<Table margin="2 4 2 4"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('padding で指定がない方向は _ で補完される', () => {
            const input = '<StackLayout paddingTop="8"/>';
            const expected = '<StackLayout padding="8 _ _ _"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid, ColumnText などの borderThickness で指定がない方向は _ で補完される', () => {
            const input = '<Grid borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="_ _ _ 2"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の borderThickness で指定がない方向は _ で補完される', () => {
            const input = '<Table borderLeftThickness="2"/>';
            const expected = '<Table borderThickness="_ _ _ 2"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderStyle で指定がない方向は _ で補完される', () => {
            const input = '<Grid borderTopStyle="none" borderLeftStyle="dotted"/>';
            const expected = '<Grid borderStyle="none _ _ dotted"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor で指定がない方向は _ で補完される', () => {
            const input = '<Grid borderTopColor="#111" borderLeftColor="#444"/>';
            const expected = '<Grid borderColor="#111 _ _ #444"/>';
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('TableColumnXxx の borderThickness で指定がない方向は _ で補完される', () => {
            const input = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Table items="${items}">',
                '      <TableColumn width="*">',
                '        <TableColumnHeader borderRightThickness="extrathick">',
                '          <Text>Column 1 Header</Text>',
                '        </TableColumnHeader>',
                '        <TableColumnTemplate>',
                '          <Text>Column 1 Body</Text>',
                '        </TableColumnTemplate>',
                '      </TableColumn>',
                '    </Table>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Table items="${items}">',
                '      <TableColumn width="*">',
                '        <TableColumnHeader borderThickness="_ extrathick _ _">',
                '          <Text>Column 1 Header</Text>',
                '        </TableColumnHeader>',
                '        <TableColumnTemplate>',
                '          <Text>Column 1 Body</Text>',
                '        </TableColumnTemplate>',
                '      </TableColumn>',
                '    </Table>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

    });

    describe('レイアウト系 XML の親子・兄弟関係のある要素の解決', () => {
        it('Grid, GridCell も、それぞれ独立して _ で補完される(1)', () => {
            const input = [
                '<Grid borderThickness="1">',
                '  <GridCell borderTopThickness="2">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid borderThickness="1">',
                '  <GridCell borderThickness="2 _ _ _">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid, GridCell も、それぞれ独立して _ で補完される(2)', () => {
            const input = [
                '<Grid borderStyle="solid">',
                '  <GridCell borderBottomStyle="regular">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid borderStyle="solid">',
                '  <GridCell borderStyle="_ _ regular _">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid, GridCell も、それぞれ独立して _ で補完される(3)', () => {
            const input = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid borderStyle="solid">',
                '      <GridCell borderBottomStyle="regular">',
                '        <Text>text</Text>',
                '      </GridCell>',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid borderStyle="solid">',
                '      <GridCell borderStyle="_ _ regular _">',
                '        <Text>text</Text>',
                '      </GridCell>',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('TableColumnTemplate, Table も、それぞれ独立して _ で補完される', () => {
            const input = [
                '<Table borderStyle="double">',
                '  <TableColumn>',
                '    <TableColumnTemplate borderRightStyle="solid">',
                '      <Text>text</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const expected = [
                '<Table borderStyle="double">',
                '  <TableColumn>',
                '    <TableColumnTemplate borderStyle="_ solid _ _">',
                '      <Text>text</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(1)', () => {
            const input = [
                '  <LinearLayout>',
                '    <LayoutBody>',
                '',
                '      <Grid cols="30 30" rows="10">',
                '        <GridCell col="0" row="0" borderThickness="1">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '        <GridCell col="1" row="0" borderTopThickness="2">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '      </Grid>',
                '',
                '    </LayoutBody>',
                '  </LinearLayout>',].join('\n');
            const expected = [
                '  <LinearLayout>',
                '    <LayoutBody>',
                '',
                '      <Grid cols="30 30" rows="10">',
                '        <GridCell col="0" row="0" borderThickness="1">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '        <GridCell col="1" row="0" borderThickness="2 _ _ _">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '      </Grid>',
                '',
                '    </LayoutBody>',
                '  </LinearLayout>',].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(2)', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0" borderTopThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="_ 5 _ _"/>',
                '  <GridCell col="1" row="0" borderThickness="5 _ _ _"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(3)', () => {
            const input = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="0" borderBottomThickness="3"/>',
                '  <GridCell col="0" row="1" borderLeftThickness="3"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="0" borderThickness="_ _ 3 _"/>',
                '  <GridCell col="0" row="1" borderThickness="_ _ _ 3"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(4)', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightStyle="dashed" borderRightColor="red"/>',
                '  <GridCell col="1" row="0" borderRightStyle="dashed" borderRightColor="red"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderStyle="_ dashed _ _" borderColor="_ red _ _"/>',
                '  <GridCell col="1" row="0" borderStyle="_ dashed _ _" borderColor="_ red _ _"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(5)', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="_ 5 _ _"/>',
                '  <GridCell col="1" row="0"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(6)', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0" borderThickness="1"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="_ 5 _ _"/>',
                '  <GridCell col="1" row="0" borderThickness="1"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(7)', () => {
            const input = [
                '<Grid cols="10 10" rows="10 10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="1" borderTopThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10 10">',
                '  <GridCell col="0" row="0" borderThickness="_ 5 _ _"/>',
                '  <GridCell col="1" row="1" borderThickness="5 _ _ _"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(8)', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '  <GridCell col="0" row="0" borderTopThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderThickness="_ _ _ 5"/>',
                '  <GridCell col="0" row="0" borderThickness="5 _ _ _"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(9)', () => {
            const input = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="1" borderTopStyle="double"/>',
                '  <GridCell col="0" row="0" borderLeftStyle="double"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="1" borderStyle="double _ _ _"/>',
                '  <GridCell col="0" row="0" borderStyle="_ _ _ double"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(10)', () => {
            const input = [
                '<Grid cols="10" rows="10">',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '  <GridCell col="0" row="0" borderRightThickness="9" borderTopThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10" rows="10">',
                '  <GridCell col="1" row="0" borderThickness="_ _ _ 5"/>',
                '  <GridCell col="0" row="0" borderThickness="5 9 _ _"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(10)', () => {
            const input = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderLeftThickness="7"/>',
                '  <GridCell col="0" row="0" borderTopThickness="3"/>',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderThickness="_ _ _ 7"/>',
                '  <GridCell col="0" row="0" borderThickness="3 _ _ _"/>',
                '  <GridCell col="1" row="0" borderThickness="_ _ _ 5"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(11)', () => {
            const input = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderLeftThickness="7"/>',
                '  <GridCell col="0" row="0" colspan="2" borderLeftThickness="5"/>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderThickness="_ _ _ 7"/>',
                '  <GridCell col="0" row="0" colspan="2" borderThickness="_ _ _ 5"/>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(12)', () => {
            const input = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnHeader borderRightThickness="extrathick">',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderRightStyle="double">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderRightColor="blue">',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnHeader borderRightThickness="thin">',
                '      <Text>header2</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderRightStyle="double">',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderRightColor="green">',
                '      <Text>footer2</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const expected = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnHeader borderThickness="_ extrathick _ _">',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderStyle="_ double _ _">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderColor="_ blue _ _">',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnHeader borderThickness="_ thin _ _">',
                '      <Text>header2</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderStyle="_ double _ _">',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderColor="_ green _ _">',
                '      <Text>footer2</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接セルは影響せずに _ で補完される(12)', () => {
            const input = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnHeader borderBottomThickness="extrathick">',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderLeftThickness="extrathick" borderBottomColor="green">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderRightColor="green">',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const expected = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnHeader borderThickness="_ _ extrathick _">',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderThickness="_ _ _ extrathick" borderColor="_ _ green _">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderColor="_ green _ _">',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });
    });

    describe('レイアウト系 XML の親子関係でさらに outer の属性も絡んでくる複雑なケースの解決', () => {
        it('Grid に outerBorderTopThickness が指定されていても、それぞれ _ で補完される', () => {
            const input = [
                '<Grid cols="100 100" rows="50 50" borderThickness="1" outerBorderTopThickness="2">',
                '  <GridCell col="0" row="0">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="100 100" rows="50 50" borderThickness="1" outerBorderThickness="2 _ _ _">',
                '  <GridCell col="0" row="0">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid に outerBorderBottomColor, outerBorderLeftStyle が指定されていても、それぞれ _ で補完される', () => {
            const input = [
                '<Grid cols="100 100" rows="50 50" borderStyle="solid" outerBorderBottomColor="#abc" outerBorderLeftStyle="solid">',
                '  <GridCell col="0" row="1">',
                '    <Text>bottom left</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1">',
                '    <Text>bottom right</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="0">',
                '    <Text>top left</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="100 100" rows="50 50" borderStyle="solid" outerBorderColor="_ _ #abc _" outerBorderStyle="_ _ _ solid">',
                '  <GridCell col="0" row="1">',
                '    <Text>bottom left</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1">',
                '    <Text>bottom right</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="0">',
                '    <Text>top left</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の outerBorder(Thickness|Style|Color) が指定されていても、それぞれ _ で補完される(1)', () => {
            const input = [
                '<Table outerBorderTopThickness="9" outerBorderBottomColor="#abc" outerBorderLeftStyle="double" outerBorderRightStyle="dotted">',
                '  <TableColumn>',
                '    <TableColumnHeader>',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate>',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter>',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnHeader>',
                '      <Text>header2</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate>',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter>',
                '      <Text>footer2</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const expected = [
                '<Table outerBorderThickness="9 _ _ _" outerBorderColor="_ _ #abc _" outerBorderStyle="_ dotted _ double">',
                '  <TableColumn>',
                '    <TableColumnHeader>',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate>',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter>',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnHeader>',
                '      <Text>header2</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate>',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter>',
                '      <Text>footer2</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の outerBorder(Thickness|Style|Color) が指定されていても、それぞれ _ で補完される(2)', () => {
            const input = [
                '<Table outerBorderTopThickness="9" outerBorderBottomColor="#abc" outerBorderLeftStyle="double" outerBorderRightStyle="dotted">',
                '  <TableColumn>',
                '    <TableColumnTemplate>',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnTemplate>',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const expected = [
                '<Table outerBorderThickness="9 _ _ _" outerBorderColor="_ _ #abc _" outerBorderStyle="_ dotted _ double">',
                '  <TableColumn>',
                '    <TableColumnTemplate>',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnTemplate>',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('関係ないセルしかなかったとしても、独立して _ で補完される', () => {
            const input = [
                '<Grid cols="100 100 100" rows="50 50 50" outerBorderTopThickness="9">',
                '  <GridCell col="1" row="1">',
                '    <Text>not top edge</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="100 100 100" rows="50 50 50" outerBorderThickness="9 _ _ _">',
                '  <GridCell col="1" row="1">',
                '    <Text>not top edge</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });

        it('変更する必要がなければ XML は変化しない', () => {
            const xml = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '',
                '      <Grid cols="30" rows="10" borderThickness="1" outerBorderThickness="2">',
                '        <GridCell col="0" row="0" borderThickness="3">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '      </Grid>',
                '',
                '      <Rectangle width="100" height="20" borderThickness="6"/>',
                '',
                '    </LayoutBody>',
                '  </LinearLayout>'].join('\n');
            const input = xml;
            const expected = xml;
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = migrated.layouts[0];
            expect(output).toBe(expected);
        });

        it('GridCell に colspan, rowspan があっても、独立して _ で補完される', () => {
            const input = [
                '<Grid cols="50 50 50" rows="30 30 30" outerBorderRightThickness="2" outerBorderBottomThickness="2">',
                '  <GridCell col="0" row="0" colspan="3" borderThickness="1">',
                '    <Text>left top</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="1" rowspan="2" borderThickness="1">',
                '    <Text>left bottom</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1" colspan="2" rowspan="2" borderThickness="1">',
                '    <Text>right bottom</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const expected = [
                '<Grid cols="50 50 50" rows="30 30 30" outerBorderThickness="_ 2 2 _">',
                '  <GridCell col="0" row="0" colspan="3" borderThickness="1">',
                '    <Text>left top</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="1" rowspan="2" borderThickness="1">',
                '    <Text>left bottom</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1" colspan="2" rowspan="2" borderThickness="1">',
                '    <Text>right bottom</Text>',
                '  </GridCell>',
                '</Grid>'].join('\n');
            const yrtDocument = { layouts: [input], style: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0]);
            expect(output).toBe(normalizeXml(expected));
        });
    });

    describe('StyleXML 内の属性の解決', () => {
        it('StyleXML 内の border 系以外の属性は普通に変換される（margin, padding, borderRadius）', () => {
            const layoutInput = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid key="key1" cols="30 30 30" rows="30 30">',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const input = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" margin="1" marginTop="2" />',
                '    <CellRange col="1" row="1" padding="1" paddingTop="2" />',
                '    <CellRange col="0" row="2" borderRadius="1" borderTopLeftRadius="2" />',
                '  </Grid>',
                '</Style>'].join('\n');
            const expected = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" margin="2 1 1 1" />',
                '    <CellRange col="1" row="1" padding="2 1 1 1" />',
                '    <CellRange col="0" row="2" borderRadius="2 1 1 1" />',
                '  </Grid>',
                '</Style>'].join('\n');
            const yrtDocument = { layouts: [layoutInput], style: input };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml((migrated.style ?? ""));
            expect(output).toBe(normalizeXml(expected));
        });

        it('StyleXML 内の border 系属性も、それぞれ独立して _ で補完される', () => {
            const layoutInput = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid key="key1" cols="30 30 30" rows="30 30">',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'].join('\n');
            const input = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" borderTopThickness="2" />',
                '    <CellRange col="1" row="1" borderRightStyle="double" />',
                '    <CellRange col="0" row="2" borderBottomColor="red" />',
                '  </Grid>',
                '</Style>'].join('\n');
            const expected = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" borderThickness="2 _ _ _" />',
                '    <CellRange col="1" row="1" borderStyle="_ double _ _" />',
                '    <CellRange col="0" row="2" borderColor="_ _ red _" />',
                '  </Grid>',
                '</Style>'].join('\n');
            const yrtDocument = { layouts: [layoutInput], style: input };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml((migrated.style ?? ""));
            expect(output).toBe(normalizeXml(expected));
        });
    });

});
