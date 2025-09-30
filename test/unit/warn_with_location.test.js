import { jest } from '@jest/globals';
import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../../src/warn_with_location.mjs";

describe("warnWithLocation", () => {
    let spy;
    beforeEach(() => {
        spy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        spy.mockRestore();
    });

    it("行番号・列番号・XPath付きで警告が出力される", () => {
        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Root>',
            '  <Foo id="a">',
            '    <Bar>baz</Bar>',
            '  </Foo>',
            '</Root>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const foo = doc.getElementsByTagName("Foo")[0];
        warnWithLocation(xml, foo, "テスト警告");
        const call = spy.mock.calls[0][0];
        expect(call).toContain("[WARNING]");
        expect(call).toContain("テスト警告");
        expect(call).toContain("@3:3");
        expect(call).toContain("/Root/Foo");
    });

    it("タグ名が重複していても指定ノードの位置を特定できる", () => {
        const xml = [
            '<Root>',
            '  <Foo id="a"/>',
            '  <Foo id="b"/>',
            '</Root>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const foos = doc.getElementsByTagName("Foo");
        warnWithLocation(xml, foos[1], "重複タグ");
        const call = spy.mock.calls[0][0];
        expect(call).toContain("重複タグ");
        expect(call).toContain("@3:3");
        expect(call).toContain("/Root/Foo[2]");
    });

    it("タグ名が存在しない場合でもエラーにならない", () => {
        const xml = '<Root></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const root = doc.documentElement;
        expect(() => warnWithLocation(xml, root, "タグなし")).not.toThrow();
    });

    it("改行なしXMLで各要素の位置を正しく特定できる", () => {
        const xml = '<Root><foo id="a"/><bar>baz</bar><foo id="b"/><baz><qux/></baz></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const foos = doc.getElementsByTagName("foo");
        const bar = doc.getElementsByTagName("bar")[0];
        const qux = doc.getElementsByTagName("qux")[0];

        warnWithLocation(xml, foos[0], "foo1");
        let call = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(call).toContain("foo1");
        expect(call).toContain("@1:7");
        expect(call).toContain("/Root/foo");

        warnWithLocation(xml, bar, "bar");
        call = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(call).toContain("bar");
        expect(call).toContain("@1:20");
        expect(call).toContain("/Root/bar");

        warnWithLocation(xml, foos[1], "foo2");
        call = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(call).toContain("foo2");
        expect(call).toContain("@1:34");
        expect(call).toContain("/Root/foo[2]");

        warnWithLocation(xml, qux, "qux");
        call = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(call).toContain("qux");
        expect(call).toContain("@1:52");
        expect(call).toContain("/Root/baz/qux");
    });

    it("XML内にコメントやCDATAが含まれていてもElementノードの位置を正しく特定できる", () => {
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Root><!-- コメント --><![CDATA[abc]]><Child>foo</Child></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const child = doc.getElementsByTagName("Child")[0];
        warnWithLocation(xml, child, "子要素");
        const call = spy.mock.calls[spy.mock.calls.length - 1][0];
        expect(call).toContain("子要素");
        expect(call).toContain("@2:35");
        expect(call).toContain("/Root/Child");
    });
});
