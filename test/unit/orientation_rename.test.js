import { migrate } from "../../src/migrate/orientation_rename.mjs";

describe("orientation_rename", () => {
    it("orientation=horizontal を landscape に変換する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <LinearLayout orientation="horizontal">',
            '    <Text>test</Text>',
            '  </LinearLayout>',
            '</LayoutXml>'
        ].join('\n');
        const input = {
            layouts: [{ name: null, xml: inputXml }],
            style: null,
            assets: null,
        };
        const yrt = migrate(input);
        expect(yrt.layouts[0].xml).toContain('orientation="landscape"');
        expect(yrt.layouts[0].xml).not.toContain('orientation="horizontal"');
    });

    it("orientation=vertical を portrait に変換する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <LinearLayout orientation="vertical">',
            '    <Text>test</Text>',
            '  </LinearLayout>',
            '</LayoutXml>'
        ].join('\n');
        const input = {
            layouts: [{ name: null, xml: inputXml }],
            style: null,
            assets: null,
        };
        const yrt = migrate(input);
        expect(yrt.layouts[0].xml).toContain('orientation="portrait"');
        expect(yrt.layouts[0].xml).not.toContain('orientation="vertical"');
    });

    it("レイアウトが2つあっても両方正しく変換される", () => {
        const inputXml1 = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <LinearLayout orientation="horizontal">',
            '    <Text>test1</Text>',
            '  </LinearLayout>',
            '</LayoutXml>'
        ].join('\n');
        const inputXml2 = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<LayoutXml>',
            '  <LinearLayout orientation="vertical">',
            '    <Text>test2</Text>',
            '  </LinearLayout>',
            '</LayoutXml>'
        ].join('\n');
        const input = {
            layouts: [
                { name: null, xml: inputXml1 },
                { name: null, xml: inputXml2 }
            ],
            style: null,
            assets: null,
        };
        const yrt = migrate(input);
        expect(yrt.layouts[0].xml).toContain('orientation="landscape"');
        expect(yrt.layouts[0].xml).not.toContain('orientation="horizontal"');
        expect(yrt.layouts[1].xml).toContain('orientation="portrait"');
        expect(yrt.layouts[1].xml).not.toContain('orientation="vertical"');
    });
});
