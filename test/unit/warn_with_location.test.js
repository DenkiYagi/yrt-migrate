import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../../src/warn_with_location.mjs";
import { createDiagnosticsBuffer, formatDiagnostic } from "../../src/diagnostics.mjs";

describe("warnWithLocation", () => {
    const SOURCE_PATH = "input.xml";
    let diagnostics;
    beforeEach(() => {
        diagnostics = createDiagnosticsBuffer(SOURCE_PATH);
    });

    it("行番号・列番号・要素名付きで警告が出力される", () => {
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
        warnWithLocation(diagnostics, xml, foo, "テスト警告");

        expect(diagnostics.items).toHaveLength(1);
        const diagnostic = diagnostics.items[0];
        expect(diagnostic).toMatchObject({
            type: "warning",
            message: "テスト警告",
            elementName: "Foo",
            line: 3,
            column: 3,
            inputXmlPath: SOURCE_PATH,
        });
        const formatted = formatDiagnostic(diagnostic);
        expect(formatted).toBe(
            [
                "[WARNING] 3行3列目: <Foo>",
                "    テスト警告",
                "    input.xml:3:3"
            ].join("\n")
        );
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
        warnWithLocation(diagnostics, xml, foos[1], "重複タグ");

        expect(diagnostics.items).toHaveLength(1);
        expect(diagnostics.items[0]).toMatchObject({
            type: "warning",
            message: "重複タグ",
            elementName: "Foo",
            line: 3,
            column: 3,
        });
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
        warnWithLocation(diagnostics, xml, targets[1], "nested");

        expect(diagnostics.items).toHaveLength(1);
        expect(diagnostics.items[0]).toMatchObject({
            type: "warning",
            message: "nested",
            elementName: "Target",
            line: 6,
            column: 5,
        });
    });

    it("タグ名が存在しない場合でもエラーにならない", () => {
        const xml = '<Root></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const root = doc.documentElement;
        expect(() => warnWithLocation(diagnostics, xml, root, "タグなし")).not.toThrow();
    });

    it("改行なしXMLで各要素の位置を正しく特定できる", () => {
        const xml = '<Root><foo id="a"/><bar>baz</bar><foo id="b"/><baz><qux/></baz></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const foos = doc.getElementsByTagName("foo");
        const bar = doc.getElementsByTagName("bar")[0];
        const qux = doc.getElementsByTagName("qux")[0];

        warnWithLocation(diagnostics, xml, foos[0], "foo1");
        expect(diagnostics.items[0]).toMatchObject({
            type: "warning",
            message: "foo1",
            elementName: "foo",
            line: 1,
            column: 7,
        });

        warnWithLocation(diagnostics, xml, bar, "bar");
        expect(diagnostics.items[1]).toMatchObject({
            type: "warning",
            message: "bar",
            elementName: "bar",
            line: 1,
            column: 20,
        });

        warnWithLocation(diagnostics, xml, foos[1], "foo2");
        expect(diagnostics.items[2]).toMatchObject({
            type: "warning",
            message: "foo2",
            elementName: "foo",
            line: 1,
            column: 34,
        });

        warnWithLocation(diagnostics, xml, qux, "qux");
        expect(diagnostics.items[3]).toMatchObject({
            type: "warning",
            message: "qux",
            elementName: "qux",
            line: 1,
            column: 52,
        });
    });

    it("XML内にコメントやCDATAが含まれていてもElementノードの位置を正しく特定できる", () => {
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Root><!-- コメント --><![CDATA[abc]]><Child>foo</Child></Root>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const child = doc.getElementsByTagName("Child")[0];
        warnWithLocation(diagnostics, xml, child, "子要素");

        expect(diagnostics.items).toHaveLength(1);
        const diagnostic = diagnostics.items[0];
        expect(diagnostic).toMatchObject({
            type: "warning",
            message: "子要素",
            elementName: "Child",
            line: 2,
            column: 35,
        });
        expect(formatDiagnostic(diagnostic)).toContain("2行35列目");
    });
});
