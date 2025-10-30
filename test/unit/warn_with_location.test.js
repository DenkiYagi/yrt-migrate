import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../../src/warn_with_location.mjs";
import { setupWarningSpy } from "../helpers/warning_spy.js";

describe("warnWithLocation", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
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
        const call = warningSpy.messages()[0];
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
        const call = warningSpy.messages()[0];
        expect(call).toContain("重複タグ");
        expect(call).toContain("@3:3");
        expect(call).toContain("/Root/Foo[2]");
    });

    it("同名要素が別階層に存在しても正しい位置を特定できる", () => {
        const xml = [
            '<Root>',
            '  <Container>',
            '    <Target id="first"/>',
            '  </Container>',
            '  <Wrapper>',
            '    <Target id="second"/>',
            '  </Wrapper>',
            '</Root>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const targets = doc.getElementsByTagName("Target");
        warnWithLocation(xml, targets[1], "nested");
        const call = warningSpy.messages().at(-1);
        expect(call).toContain("nested");
        expect(call).toContain("@6:5");
        expect(call).toContain("/Root/Wrapper/Target");
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
        let call = warningSpy.messages().at(-1);
        expect(call).toContain("foo1");
        expect(call).toContain("@1:7");
        expect(call).toContain("/Root/foo");

        warnWithLocation(xml, bar, "bar");
        call = warningSpy.messages().at(-1);
        expect(call).toContain("bar");
        expect(call).toContain("@1:20");
        expect(call).toContain("/Root/bar");

        warnWithLocation(xml, foos[1], "foo2");
        call = warningSpy.messages().at(-1);
        expect(call).toContain("foo2");
        expect(call).toContain("@1:34");
        expect(call).toContain("/Root/foo[2]");

        warnWithLocation(xml, qux, "qux");
        call = warningSpy.messages().at(-1);
        expect(call).toContain("qux");
        expect(call).toContain("@1:52");
        expect(call).toContain("/Root/baz/qux");
    });

    it("XML内にコメントやCDATAが含まれていてもElementノードの位置を正しく特定できる", () => {
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Root><!-- コメント --><![CDATA[abc]]><Child>foo</Child></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const child = doc.getElementsByTagName("Child")[0];
        warnWithLocation(xml, child, "子要素");
        const call = warningSpy.messages().at(-1);
        expect(call).toContain("子要素");
        expect(call).toContain("@2:35");
        expect(call).toContain("/Root/Child");
    });
});
