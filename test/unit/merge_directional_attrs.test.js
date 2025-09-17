import { it, jest } from '@jest/globals';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { migrate } from '../../src/migrate/merge_directional_attrs.mjs';


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
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('margin の統合（値に前後空白あり）', () => {
            const input = '<StackLayout marginTop=" 1 " marginRight=" 2 " marginBottom=" 3 " marginLeft=" 4 "/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor の統合', () => {
            const input = '<LinearLayout borderTopColor="#111" borderRightColor="#222" borderBottomColor="#333" borderLeftColor="#444"/>';
            const expected = '<LinearLayout borderColor="#111 #222 #333 #444"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderStyle の統合', () => {
            const input = '<Grid borderTopStyle="solid" borderRightStyle="dashed" borderBottomStyle="dotted" borderLeftStyle="double"/>';
            const expected = '<Grid borderStyle="solid dashed dotted double"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderThickness の統合', () => {
            const input = '<Table outerBorderTopThickness="1" outerBorderRightThickness="2" outerBorderBottomThickness="3" outerBorderLeftThickness="4"/>';
            const expected = '<Table outerBorderThickness="1 2 3 4"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderColor の統合', () => {
            const input = '<Table outerBorderTopColor="#111" outerBorderRightColor="#222" outerBorderBottomColor="#333" outerBorderLeftColor="#444"/>';
            const expected = '<Table outerBorderColor="#111 #222 #333 #444"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('outerBorderStyle の統合', () => {
            const input = '<Table outerBorderTopStyle="solid" outerBorderRightStyle="dashed" outerBorderBottomStyle="dotted" outerBorderLeftStyle="double"/>';
            const expected = '<Table outerBorderStyle="solid dashed dotted double"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderRadius の統合', () => {
            const input = '<Rectangle borderTopLeftRadius="4" borderTopRightRadius="6" borderBottomRightRadius="8" borderBottomLeftRadius="10"/>';
            const expected = '<Rectangle borderRadius="4 6 8 10"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderThickness の統合', () => {
            const input = '<LinearLayout borderTopThickness="1" borderRightThickness="2" borderBottomThickness="3" borderLeftThickness="4"/>';
            const expected = '<LinearLayout borderThickness="1 2 3 4"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('上下のみ指定した場合は4値で補完しつつ、足りない部分をデフォルト値で補完する', () => {
            const input = '<StackLayout paddingTop="8" paddingBottom="8"/>';
            const expected = '<StackLayout padding="8 0 8 0"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('一括指定値と個別指定値があった場合は、一括指定値を個別指定値で上書きする', () => {
            const input = '<Grid borderThickness="5" borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="5 5 5 2"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('すでに統合済みの場合は何もしない', () => {
            const input = '<Table margin="2 4 2 4"/>';
            const expected = '<Table margin="2 4 2 4"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('padding は初期値 0 で補完される', () => {
            const input = '<StackLayout paddingTop="8"/>';
            const expected = '<StackLayout padding="8 0 0 0"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid, ColumnText などの borderThickness は初期値 0 で補完される', () => {
            const input = '<Grid borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="0 0 0 2"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の borderThickness は初期値 regular で補完される', () => {
            const input = '<Table borderLeftThickness="2"/>';
            const expected = '<Table borderThickness="regular regular regular 2"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderStyle は初期値 solid で補完される', () => {
            const input = '<Grid borderTopStyle="none" borderLeftStyle="dotted"/>';
            const expected = '<Grid borderStyle="none solid solid dotted"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderColor は初期値 black で補完される', () => {
            const input = '<Grid borderTopColor="#111" borderLeftColor="#444"/>';
            const expected = '<Grid borderColor="#111 black black #444"/>';
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('TableColumnXxx の borderThickness は初期値 regular で補完される', () => {
            const input = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Table items="${items}">',
                '      <TableColumn width="*">',
                '        <TableColumnHeader borderTopThickness="extrathick">',
                '          <Text>Column 1 Header</Text>',
                '        </TableColumnHeader>',
                '        <TableColumnTemplate>',
                '          <Text>Column 1 Body</Text>',
                '        </TableColumnTemplate>',
                '      </TableColumn>',
                '    </Table>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Table items="${items}">',
                '      <TableColumn width="*">',
                '        <TableColumnHeader borderThickness="extrathick regular regular regular">',
                '          <Text>Column 1 Header</Text>',
                '        </TableColumnHeader>',
                '        <TableColumnTemplate>',
                '          <Text>Column 1 Body</Text>',
                '        </TableColumnTemplate>',
                '      </TableColumn>',
                '    </Table>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

    });

    describe('レイアウト系 XML の親子・兄弟関係のある要素の解決', () => {
        it('Grid, GridCell の継承を解消できる(1)', () => {
            const input = [
                '<Grid borderThickness="1">',
                '  <GridCell borderTopThickness="2">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid>',
                '  <GridCell borderThickness="2 1 1 1">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid, GridCell の継承を解消できる(2)', () => {
            const input = [
                '<Grid borderStyle="solid">',
                '  <GridCell borderBottomStyle="regular">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid>',
                '  <GridCell borderStyle="solid solid regular solid">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('LayoutBody配下のGrid, GridCell の継承を解消できる(2)', () => {
            const input = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid borderStyle="solid">',
                '      <GridCell borderBottomStyle="regular">',
                '        <Text>text</Text>',
                '      </GridCell>',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid>',
                '      <GridCell borderStyle="solid solid regular solid">',
                '        <Text>text</Text>',
                '      </GridCell>',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('TableColumnTemplate の個別指定値と Table の一括指定値が統合される', () => {
            const input = [
                '<Table borderStyle="double">',
                '  <TableColumn>',
                '    <TableColumnTemplate borderTopStyle="solid">',
                '      <Text>text</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n');
            const expected = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnTemplate borderStyle="solid double double double">',
                '      <Text>text</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('col="0",row="0" のセルの右端の値が初期値よりも優先される', () => {
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
                '  </LinearLayout>',
            ].join('\n');
            const expected = [
                '  <LinearLayout>',
                '    <LayoutBody>',
                '',
                '      <Grid cols="30 30" rows="10">',
                '        <GridCell col="0" row="0" borderThickness="1">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '        <GridCell col="1" row="0" borderThickness="2 0 0 1">',
                '          <Text>text</Text>',
                '        </GridCell>',
                '      </Grid>',
                '',
                '    </LayoutBody>',
                '  </LinearLayout>',
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('左隣セルのborderRightThicknessが右セルに伝播する', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0" borderTopThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="0 5 0 0"/>',
                '  <GridCell col="1" row="0" borderThickness="5 0 0 5"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('上隣セルのborderBottomThicknessが下セルのborderTopThicknessに伝播する', () => {
            const input = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="0" borderBottomThickness="3"/>',
                '  <GridCell col="0" row="1" borderLeftThickness="3"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="0" borderThickness="0 0 3 0"/>',
                '  <GridCell col="0" row="1" borderThickness="3 0 0 3"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('borderStyle, borderColor も伝播する', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightStyle="dashed" borderRightColor="red"/>',
                '  <GridCell col="1" row="0" borderRightStyle="dashed" borderRightColor="red"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderStyle="solid dashed solid solid" borderColor="black red black black"/>',
                '  <GridCell col="1" row="0" borderStyle="solid dashed solid dashed" borderColor="black red black red"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('初期値で埋める必要がなければ変わらない（指定なし）', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="0 5 0 0"/>',
                '  <GridCell col="1" row="0"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('初期値で埋める必要がなければ変わらない（指定あり）', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="0" borderThickness="1"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="0" row="0" borderThickness="0 5 0 0"/>',
                '  <GridCell col="1" row="0" borderThickness="1"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('隣接しない場合は伝搬しない', () => {
            const input = [
                '<Grid cols="10 10" rows="10 10">',
                '  <GridCell col="0" row="0" borderRightThickness="5"/>',
                '  <GridCell col="1" row="1" borderTopThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10 10">',
                '  <GridCell col="0" row="0" borderThickness="0 5 0 0"/>',
                '  <GridCell col="1" row="1" borderThickness="5 0 0 0"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('書いた順に優先される', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '  <GridCell col="0" row="0" borderTopThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderThickness="0 0 0 5"/>',
                '  <GridCell col="0" row="0" borderThickness="5 5 0 0"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('書いた順に優先される（上下方向）', () => {
            const input = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="1" borderTopStyle="double"/>',
                '  <GridCell col="0" row="0" borderLeftStyle="double"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10" rows="10 10">',
                '  <GridCell col="0" row="1" borderStyle="double solid solid solid"/>',
                '  <GridCell col="0" row="0" borderStyle="solid solid double double"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('書いた順に優先される（明示的な競合: 先に書いた値が優先）', () => {
            const input = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '  <GridCell col="0" row="0" borderRightThickness="9" borderTopThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10" rows="10">',
                '  <GridCell col="1" row="0" borderThickness="0 0 0 5"/>',
                '  <GridCell col="0" row="0" borderThickness="5 9 0 0"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('書いた順に優先される（複数セル混在）', () => {
            const input = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderLeftThickness="7"/>',
                '  <GridCell col="0" row="0" borderTopThickness="3"/>',
                '  <GridCell col="1" row="0" borderLeftThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderThickness="0 0 0 7"/>',
                '  <GridCell col="0" row="0" borderThickness="3 5 0 0"/>',
                '  <GridCell col="1" row="0" borderThickness="0 7 0 5"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('書いた順に優先される（colspan, rowspan を含む）', () => {
            const input = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderLeftThickness="7"/>',
                '  <GridCell col="0" row="0" colspan="2" borderLeftThickness="5"/>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="10 10 10" rows="10">',
                '  <GridCell col="2" row="0" borderThickness="0 0 0 7"/>',
                '  <GridCell col="0" row="0" colspan="2" borderThickness="0 7 0 5"/>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });
    });

    describe('レイアウト系 XML の親子関係でさらに outer の属性も絡んでくる複雑なケースの解決', () => {
        it('Grid に outerBorderTopThickness が指定されているケース', () => {
            const input = [
                '<Grid cols="100 100" rows="50 50" borderThickness="1" outerBorderTopThickness="2">',
                '  <GridCell col="0" row="0">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="100 100" rows="50 50">',
                '  <GridCell col="0" row="0" borderThickness="2 1 1 1">',
                '    <Text>text</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Grid に outerBorderBottomColor, outerBorderLeftStyle が指定されているケース', () => {
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
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="100 100" rows="50 50">',
                '  <GridCell col="0" row="1" borderStyle="solid solid solid solid" borderColor="black black #abc black">',
                '    <Text>bottom left</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1" borderColor="black black #abc black">',
                '    <Text>bottom right</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="0" borderStyle="solid solid solid solid">',
                '    <Text>top left</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の outerBorder(Thickness|Style|Color) が TableColumnXxx に割り振られ、値がないところは regular, black, solid となる （Header,Footerあり）', () => {
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
                '</Table>'
            ].join('\n');
            const expected = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnHeader borderThickness="9 regular regular regular" borderStyle="solid solid solid double">',
                '      <Text>header1</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderStyle="solid solid solid double">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderStyle="solid solid solid double" borderColor="black black #abc black">',
                '      <Text>footer1</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnHeader borderThickness="9 regular regular regular" borderStyle="solid dotted solid solid">',
                '      <Text>header2</Text>',
                '    </TableColumnHeader>',
                '    <TableColumnTemplate borderStyle="solid dotted solid solid">',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '    <TableColumnFooter borderStyle="solid dotted solid solid" borderColor="black black #abc black">',
                '      <Text>footer2</Text>',
                '    </TableColumnFooter>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });

        it('Table の outerBorder(Thickness|Style|Color) が TableColumnXxx に割り振られ、値がないところは regular, solid, black となる、レイアウトが変わる警告を出す （Header,Footerなし）', () => {
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
                '</Table>'
            ].join('\n');
            const expected = [
                '<Table>',
                '  <TableColumn>',
                '    <TableColumnTemplate borderThickness="9 regular regular regular" borderStyle="solid solid solid double" borderColor="black black #abc black">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnTemplate borderThickness="9 regular regular regular" borderStyle="solid dotted solid solid" borderColor="black black #abc black">',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('関係ないセルには何も付与されない', () => {
            const input = [
                '<Grid cols="100 100 100" rows="50 50 50" outerBorderTopThickness="9">',
                '  <GridCell col="1" row="1">',
                '    <Text>not top edge</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="100 100 100" rows="50 50 50">',
                '  <GridCell col="1" row="1">',
                '    <Text>not top edge</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
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
                '  </LinearLayout>'
            ].join('\n');
            const input = xml;
            const expected = xml;
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = migrated.layouts[0].xml;
            expect(output).toBe(expected);
        });

        it('GridCell に colspan, rowspan があっても正しく端の判定をして変換できる', () => {
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
                '</Grid>'
            ].join('\n');
            const expected = [
                '<Grid cols="50 50 50" rows="30 30 30">',
                '  <GridCell col="0" row="0" colspan="3" borderThickness="1 2 1 1">',
                '    <Text>left top</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="1" rowspan="2" borderThickness="1 1 2 1">',
                '    <Text>left bottom</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1" colspan="2" rowspan="2" borderThickness="1 2 2 1">',
                '    <Text>right bottom</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.layouts[0].xml);
            expect(output).toBe(normalizeXml(expected));
        });
    });

    describe('StyleXML 内の属性の解決および警告', () => {
        it('border 系以外の属性は普通に変換される（margin, padding, borderRadius）', () => {
            const layoutInput = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid key="key1" cols="30 30 30" rows="30 30">',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const input = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" margin="1" marginTop="2" />',
                '    <CellRange col="1" row="1" padding="1" paddingTop="2" />',
                '    <CellRange col="0" row="2" borderRadius="1" borderTopLeftRadius="2" />',
                '  </Grid>',
                '</Style>'
            ].join('\n');

            const expected = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" margin="2 1 1 1" />',
                '    <CellRange col="1" row="1" padding="2 1 1 1" />',
                '    <CellRange col="0" row="2" borderRadius="2 1 1 1" />',
                '  </Grid>',
                '</Style>'
            ].join('\n');
            const yrtDocument = { layouts: [{ name: null, xml: layoutInput }], style: input, assets: null };
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.style);
            expect(output).toBe(normalizeXml(expected));
        });

        it('border 系属性は一切変更せずに警告を出す', () => {
            const layoutInput = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Grid key="key1" cols="30 30 30" rows="30 30">',
                '    </Grid>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            const input = [
                '<Style>',
                '  <Grid key="key1">',
                '    <CellRange col="0" row="0" borderTopThickness="2" />',
                '    <CellRange col="1" row="1" borderRightStyle="double" />',
                '    <CellRange col="0" row="2" borderBottomColor="red" />',
                '  </Grid>',
                '</Style>'
            ].join('\n');

            const expected = input;
            const yrtDocument = { layouts: [{ name: null, xml: layoutInput }], style: input, assets: null };
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const migrated = migrate(yrtDocument);
            const output = normalizeXml(migrated.style);
            expect(output).toBe(normalizeXml(expected));
            expect(warnSpy).toHaveBeenCalled();
            // 警告メッセージに key が含まれているか検証
            const hasKeyInWarning = warnSpy.mock.calls.some(call => call[0].includes('key="key1"'));
            expect(hasKeyInWarning).toBe(true);
            warnSpy.mockRestore();
        });
    });
});
