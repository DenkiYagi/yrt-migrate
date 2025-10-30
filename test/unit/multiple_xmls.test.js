import { migrate } from "../../src/migrate/multiple_xmls.mjs";

describe("multiple_xmls", () => {
    it("LayoutXml直下の複数レイアウトを分割してlayouts配列に格納する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '    <LinearLayout direction="vertical">',
            '        <Text>Layout 1</Text>',
            '    </LinearLayout>',
            '    <StackLayout>',
            '        <Text>Layout 2</Text>',
            '    </StackLayout>',
            '</LayoutXml>'].join('\n');
        const legacyDocument = {
            xml: inputXml,
        };
        const result = migrate(legacyDocument);
        expect(result.layouts.length).toBe(2);

        expect(result.layouts[0].startsWith("<LinearLayout")).toBe(true);
        expect(result.layouts[0]).toContain("Layout 1");
        expect(result.layouts[0]).not.toContain("Layout 2");
        expect(result.layouts[0].endsWith("</LinearLayout>")).toBe(true);

        expect(result.layouts[1].startsWith("<StackLayout")).toBe(true);
        expect(result.layouts[1]).toContain("Layout 2");
        expect(result.layouts[1]).not.toContain("Layout 1");
        expect(result.layouts[1].endsWith("</StackLayout>")).toBe(true);
    });

    it("LinearLayout | StackLayout が見つからない場合、空の LinearLayout を追加する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '    <Text>Some other content</Text>',
            '    <Button>Not a layout element</Button>',
            '</LayoutXml>'].join('\n');
        const legacyDocument = {
            xml: inputXml,
        };
        const result = migrate(legacyDocument);

        expect(result.layouts.length).toBe(1);
        expect(result.layouts[0]).toBe("<LinearLayout></LinearLayout>");
        expect(result.style).toBeNull();
    });
});
