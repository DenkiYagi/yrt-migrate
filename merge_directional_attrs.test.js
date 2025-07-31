import { migrate } from './merge_directional_attrs.mjs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { strict as assert } from 'assert';

describe('mergeDirectionalAttributes', () => {
    it('margin の統合', () => {
        const input = '<StackLayout marginTop="1" marginRight="2" marginBottom="3" marginLeft="4"/>';
        const expected = '<StackLayout margin="1 2 3 4"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('borderColor の統合', () => {
        const input = '<LinearLayout borderTopColor="#111" borderRightColor="#222" borderBottomColor="#333" borderLeftColor="#444"/>';
        const expected = '<LinearLayout borderColor="#111 #222 #333 #444"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('borderStyle の統合', () => {
        const input = '<Grid borderTopStyle="solid" borderRightStyle="dashed" borderBottomStyle="dotted" borderLeftStyle="double"/>';
        const expected = '<Grid borderStyle="solid dashed dotted double"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('outerBorderThickness の統合', () => {
        const input = '<Table outerBorderTopThickness="1" outerBorderRightThickness="2" outerBorderBottomThickness="3" outerBorderLeftThickness="4"/>';
        const expected = '<Table outerBorderThickness="1 2 3 4"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('outerBorderColor の統合', () => {
        const input = '<Table outerBorderTopColor="#111" outerBorderRightColor="#222" outerBorderBottomColor="#333" outerBorderLeftColor="#444"/>';
        const expected = '<Table outerBorderColor="#111 #222 #333 #444"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('outerBorderStyle の統合', () => {
        const input = '<Table outerBorderTopStyle="solid" outerBorderRightStyle="dashed" outerBorderBottomStyle="dotted" outerBorderLeftStyle="double"/>';
        const expected = '<Table outerBorderStyle="solid dashed dotted double"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('borderRadius の統合', () => {
        const input = '<Rectangle borderTopLeftRadius="4" borderTopRightRadius="6" borderBottomRightRadius="8" borderBottomLeftRadius="10"/>';
        const expected = '<Rectangle borderRadius="4 6 8 10"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('4方向すべて指定', () => {
        const input = '<LinearLayout borderTopThickness="1" borderRightThickness="2" borderBottomThickness="3" borderLeftThickness="4"/>';
        const expected = '<LinearLayout borderThickness="1 2 3 4"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('上下のみ指定（4値で補完）', () => {
        const input = '<StackLayout paddingTop="8" paddingBottom="8"/>';
        const expected = '<StackLayout padding="8 0 8 0"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('一括指定と個別指定のマージ', () => {
        const input = '<Grid borderThickness="5" borderLeftThickness="2"/>';
        const expected = '<Grid borderThickness="5 5 5 2"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('すでに統合済みの場合', () => {
        const input = '<Table margin="2 4 2 4"/>';
        const expected = '<Table margin="2 4 2 4"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('未指定部分がある場合（デフォルト0で補完）', () => {
        const input = '<StackLayout paddingTop="8"/>';
        const expected = '<StackLayout padding="8 0 0 0"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('borderStyle の未指定部分はスキーマで許されている none で補完して4値で統合', () => {
        const input = '<Grid borderTopStyle="solid" borderLeftStyle="dotted"/>';
        const expected = '<Grid borderStyle="solid none none dotted"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });

    it('borderColor の未指定部分はスキーマで許されている transparent で補完して4値で統合', () => {
        const input = '<Grid borderTopColor="#111" borderLeftColor="#444"/>';
        const expected = '<Grid borderColor="#111 transparent transparent #444"/>';
        const doc = new DOMParser().parseFromString(input, 'text/xml');
        migrate(doc);
        const output = new XMLSerializer().serializeToString(doc.documentElement);
        assert.equal(output, expected);
    });
});

