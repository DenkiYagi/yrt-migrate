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
            '</LayoutXml>'
        ].join('\n');
        const yrtOldDocument = {
            xml: inputXml,
            assets: null,
        };
        const result = migrate(yrtOldDocument);
        expect(result.layouts.length).toBe(2);

        expect(result.layouts[0].xml.startsWith("<LinearLayout")).toBe(true);
        expect(result.layouts[0].xml).toContain("Layout 1");
        expect(result.layouts[0].xml).not.toContain("Layout 2");
        expect(result.layouts[0].xml.endsWith("</LinearLayout>")).toBe(true);

        expect(result.layouts[1].xml.startsWith("<StackLayout")).toBe(true);
        expect(result.layouts[1].xml).toContain("Layout 2");
        expect(result.layouts[1].xml).not.toContain("Layout 1");
        expect(result.layouts[1].xml.endsWith("</StackLayout>")).toBe(true);
    });

    it("LinearLayout | StackLayout が見つからない場合、空の LinearLayout を追加する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '    <Text>Some other content</Text>',
            '    <Button>Not a layout element</Button>',
            '</LayoutXml>'
        ].join('\n');
        const yrtOldDocument = {
            xml: inputXml,
            assets: null,
        };
        const result = migrate(yrtOldDocument);

        expect(result.layouts.length).toBe(1);
        expect(result.layouts[0].xml).toBe("<LinearLayout></LinearLayout>");
        expect(result.layouts[0].name).toBe(null);
    });
});
