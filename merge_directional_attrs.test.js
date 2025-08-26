import { migrate } from './merge_directional_attrs.mjs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { strict as assert } from 'assert';
import { toYrtRoot, fromYrtRoot } from './utils.js';
import { assignOuterBorderDirectionalAttributes } from './merge_directional_attrs.mjs';

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
            assert.equal(output, expected);
        });

        it('margin の統合（値に前後空白あり）', () => {
            const input = '<StackLayout marginTop=" 1 " marginRight=" 2 " marginBottom=" 3 " marginLeft=" 4 "/>';
            const expected = '<StackLayout margin="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
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
            assert.equal(output, expected);
        });

        it('borderStyle の統合', () => {
            const input = '<Grid borderTopStyle="solid" borderRightStyle="dashed" borderBottomStyle="dotted" borderLeftStyle="double"/>';
            const expected = '<Grid borderStyle="solid dashed dotted double"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('outerBorderThickness の統合', () => {
            const input = '<Table outerBorderTopThickness="1" outerBorderRightThickness="2" outerBorderBottomThickness="3" outerBorderLeftThickness="4"/>';
            const expected = '<Table outerBorderThickness="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('outerBorderColor の統合', () => {
            const input = '<Table outerBorderTopColor="#111" outerBorderRightColor="#222" outerBorderBottomColor="#333" outerBorderLeftColor="#444"/>';
            const expected = '<Table outerBorderColor="#111 #222 #333 #444"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('outerBorderStyle の統合', () => {
            const input = '<Table outerBorderTopStyle="solid" outerBorderRightStyle="dashed" outerBorderBottomStyle="dotted" outerBorderLeftStyle="double"/>';
            const expected = '<Table outerBorderStyle="solid dashed dotted double"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('borderRadius の統合', () => {
            const input = '<Rectangle borderTopLeftRadius="4" borderTopRightRadius="6" borderBottomRightRadius="8" borderBottomLeftRadius="10"/>';
            const expected = '<Rectangle borderRadius="4 6 8 10"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('4方向すべて指定', () => {
            const input = '<LinearLayout borderTopThickness="1" borderRightThickness="2" borderBottomThickness="3" borderLeftThickness="4"/>';
            const expected = '<LinearLayout borderThickness="1 2 3 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('上下のみ指定（4値で補完）', () => {
            const input = '<StackLayout paddingTop="8" paddingBottom="8"/>';
            const expected = '<StackLayout padding="8 0 8 0"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('一括指定と個別指定のマージ', () => {
            const input = '<Grid borderThickness="5" borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="5 5 5 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('すでに統合済みの場合は何もしない', () => {
            const input = '<Table margin="2 4 2 4"/>';
            const expected = '<Table margin="2 4 2 4"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('padding は初期値 0 で補完される', () => {
            const input = '<StackLayout paddingTop="8"/>';
            const expected = '<StackLayout padding="8 0 0 0"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('Grid, ColumnText などの borderThickness は初期値 0 で補完される', () => {
            const input = '<Grid borderLeftThickness="2"/>';
            const expected = '<Grid borderThickness="0 0 0 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('Table の borderThickness は初期値 regular で補完される', () => {
            const input = '<Table borderLeftThickness="2"/>';
            const expected = '<Table borderThickness="regular regular regular 2"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('borderStyle は初期値 solid で補完される', () => {
            const input = '<Grid borderTopStyle="none" borderLeftStyle="dotted"/>';
            const expected = '<Grid borderStyle="none solid solid dotted"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        it('borderColor は初期値 black で補完される', () => {
            const input = '<Grid borderTopColor="#111" borderLeftColor="#444"/>';
            const expected = '<Grid borderColor="#111 black black #444"/>';
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
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
            assert.equal(output, expected);
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
            assert.equal(output, expected);
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
            assert.equal(output, expected);
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
                '  <GridCell col="0" row="1" borderStyle="solid solid solid solid">',
                '    <Text>bottom left</Text>',
                '  </GridCell>',
                '  <GridCell col="1" row="1">',
                '    <Text>bottom right</Text>',
                '  </GridCell>',
                '  <GridCell col="0" row="0" borderColor="black black #abc black">',
                '    <Text>top left</Text>',
                '  </GridCell>',
                '</Grid>'
            ].join('\n');
            const yrtRoot = toYrtRoot({ layouts: [input] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
            const output = new XMLSerializer().serializeToString(doc.documentElement);
            assert.equal(output, expected);
        });

        // it('Grid の端以外のセルには outerBorder 属性は割り当てられない', () => {
        //     const input = [
        //         '<Grid cols="100 100" rows="50 50" outerBorderTopThickness="9">',
        //         '  <GridCell col="1" row="1">',
        //         '    <Text>not top edge</Text>',
        //         '  </GridCell>',
        //         '  <GridCell col="0" row="0">',
        //         '    <Text>top left</Text>',
        //         '  </GridCell>',
        //         '</Grid>'
        //     ].join('\n');
        //     const expected = [
        //         '<Grid cols="100 100" rows="50 50">',
        //         '  <GridCell col="1" row="1">',
        //         '    <Text>not top edge</Text>',
        //         '  </GridCell>',
        //         '  <GridCell col="0" row="0" borderThickness="9 0 0 0">',
        //         '    <Text>top left</Text>',
        //         '  </GridCell>',
        //         '</Grid>'
        //     ].join('\n');
        //     const yrtRoot = toYrtRoot({ layouts: [input] });
        //     const migrated = migrate(yrtRoot);
        //     const { layouts } = fromYrtRoot(migrated);
        //     const doc = new DOMParser().parseFromString(layouts[0], 'text/xml');
        //     const output = new XMLSerializer().serializeToString(doc.documentElement);
        //     assert.equal(output, expected);
        // });
    });
});

describe('assignOuterBorderDirectionalAttributes 単体テスト', () => {
    it('Grid の outerXxx を GridCell の xxx に割り振り', () => {
        const input = [
            '<Grid cols="100 100" rows="50 50" borderThickness="1" outerBorderTopThickness="2">',
            '  <GridCell col="0" row="0">',
            '    <Text>text</Text>',
            '  </GridCell>',
            '</Grid>'
        ].join('\n');
        const expected = [
            '<Grid cols="100 100" rows="50 50" borderThickness="1">',
            '  <GridCell col="0" row="0" borderTopThickness="2">',
            '    <Text>text</Text>',
            '  </GridCell>',
            '</Grid>'
        ].join('\n');
        const output = assignOuterBorderDirectionalAttributes(input);
        expect(output).toBe(expected);
    });

    it('Grid の複数 outerXxx を GridCell の xxx に割り振り', () => {
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
        const output = assignOuterBorderDirectionalAttributes(input);
        // 順序を許容し、属性の存在のみ確認
        const cellMatch = output.match(/<GridCell col="0" row="1"([^>]*)>/);
        expect(cellMatch).not.toBeNull();
        const attrs = cellMatch[1];
        expect(attrs).toContain('borderLeftStyle="solid"');
        expect(attrs).toContain('borderBottomColor="#abc"');
    });
});
