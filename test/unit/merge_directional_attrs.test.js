import { jest } from '@jest/globals';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { migrate } from '../../src/migrate/merge_directional_attrs.mjs';
import { toYrtRoot, fromYrtRoot } from '../../src/utils.js';

describe('mergeDirectionalAttributes', () => {
    describe('単一要素が解決できているか', () => {
        it('margin の統合', () => {
            const input = '<StackLayout marginTop="1" marginRight="2" marginBottom="3" marginLeft="4"/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('margin の統合（値に前後空白あり）', () => {
            const input = '<StackLayout marginTop=" 1 " marginRight=" 2 " marginBottom=" 3 " marginLeft=" 4 "/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
            // 他の属性については、同一ロジックであるため同種のテストは省略します。
        });

        it('borderColor の統合', () => {
            const input = '<LinearLayout borderTopColor="#111" borderRightColor="#222" borderBottomColor="#333" borderLeftColor="#444"/>';
            const expected = '<LinearLayout borderColor="#111 #222 #333 #444"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('borderStyle の統合', () => {
            const input = '<Grid borderTopStyle="solid" borderRightStyle="dashed" borderBottomStyle="dotted" borderLeftStyle="double"/>';
            const expected = '<Grid borderStyle="solid dashed dotted double"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('outerBorderThickness の統合', () => {
            const input = '<Table outerBorderTopThickness="1" outerBorderRightThickness="2" outerBorderBottomThickness="3" outerBorderLeftThickness="4"/>';
            const expected = '<Table outerBorderThickness="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('outerBorderColor の統合', () => {
            const input = '<Table outerBorderTopColor="#111" outerBorderRightColor="#222" outerBorderBottomColor="#333" outerBorderLeftColor="#444"/>';
            const expected = '<Table outerBorderColor="#111 #222 #333 #444"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('outerBorderStyle の統合', () => {
            const input = '<Table outerBorderTopStyle="solid" outerBorderRightStyle="dashed" outerBorderBottomStyle="dotted" outerBorderLeftStyle="double"/>';
            const expected = '<Table outerBorderStyle="solid dashed dotted double"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('borderRadius の統合', () => {
            const input = '<Rectangle borderTopLeftRadius="4" borderTopRightRadius="6" borderBottomRightRadius="8" borderBottomLeftRadius="10"/>';
            const expected = '<Rectangle borderRadius="4 6 8 10"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('4方向すべて指定', () => {
            const input = '<LinearLayout borderTopThickness="1" borderRightThickness="2" borderBottomThickness="3" borderLeftThickness="4"/>';
            const expected = '<LinearLayout borderThickness="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('上下のみ指定（4値で補完）', () => {
            const input = '<StackLayout paddingTop="8" paddingBottom="8"/>';
            const expected = '<StackLayout padding="8 0 8 0"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('一括指定と個別指定のマージ', () => {
            const input = '<Grid borderThickness="5" borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="5 5 5 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('すでに統合済みの場合は何もしない', () => {
            const input = '<Table margin="2 4 2 4"/>';
            const expected = '<Table margin="2 4 2 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('padding は初期値 0 で補完される', () => {
            const input = '<StackLayout paddingTop="8"/>';
            const expected = '<StackLayout padding="8 0 0 0"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('Grid, ColumnText などの borderThickness は初期値 0 で補完される', () => {
            const input = '<Grid borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="0 0 0 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('Table の borderThickness は初期値 regular で補完される', () => {
            const input = '<Table borderLeftThickness="2"/>';
            const expected = '<Table borderThickness="regular regular regular 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('borderStyle は初期値 solid で補完される', () => {
            const input = '<Grid borderTopStyle="none" borderLeftStyle="dotted"/>';
            const expected = '<Grid borderStyle="none solid solid dotted"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('borderColor は初期値 black で補完される', () => {
            const input = '<Grid borderTopColor="#111" borderLeftColor="#444"/>';
            const expected = '<Grid borderColor="#111 black black #444"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });
    });

    describe('親子関係のある要素の解決', () => {
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });
    });

    describe('親子関係でさらに outer の属性も絡んでくる複雑なケースの解決', () => {
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('Table の outerBorder 系属性が TableColumnXxx に割り振られる（Header,Footerあり）', () => {
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
                '    <TableColumnHeader borderThickness="9 0 0 0" borderStyle="solid solid solid double">',
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
                '    <TableColumnHeader borderThickness="9 0 0 0" borderStyle="solid dotted solid solid">',
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });

        it('Table の outerBorder 系属性が TableColumnXxx に割り振られつつ、レイアウトが変わる警告を出す（Header,Footerなし）', () => {
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
                '    <TableColumnTemplate borderThickness="9 0 0 0" borderStyle="solid solid solid double" borderColor="black black #abc black">',
                '      <Text>body1</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '  <TableColumn>',
                '    <TableColumnTemplate borderThickness="9 0 0 0" borderStyle="solid dotted solid solid" borderColor="black black #abc black">',
                '      <Text>body2</Text>',
                '    </TableColumnTemplate>',
                '  </TableColumn>',
                '</Table>'
            ].join('\n');
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
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
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            expect(output).toBe(expected);
        });
    });
});
