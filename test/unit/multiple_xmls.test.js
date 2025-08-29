import * as multiple_xmls from "../../src/migrate/multiple_xmls.mjs";
import { yrtRootToPackage } from "../../src/yrt_format.js";

describe("multiple_xmls", () => {
    it("LayoutXml直下の複数レイアウトを分割してlayouts配列に格納する", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <LinearLayout direction="vertical">
        <Text>Layout 1</Text>
    </LinearLayout>
    <StackLayout>
        <Text>Layout 2</Text>
    </StackLayout>
</LayoutXml>`;
        // YRTルート形式: ["YRT", 1, { l: [[null, xml]], s: null, a: null }]
        const yrtRoot = [
            "YRT",
            1,
            {
                l: [[null, inputXml]],
                s: null,
                a: null,
            },
        ];
        const result = multiple_xmls.migrate(yrtRoot);
        const pkg = yrtRootToPackage(result);
        expect(pkg.layouts.length).toBe(2);

        expect(pkg.layouts[0].xml.startsWith("<LinearLayout")).toBe(true);
        expect(pkg.layouts[0].xml).toContain("Layout 1");
        expect(pkg.layouts[0].xml).not.toContain("Layout 2");
        expect(pkg.layouts[0].xml.endsWith("</LinearLayout>")).toBe(true);

        expect(pkg.layouts[1].xml.startsWith("<StackLayout")).toBe(true);
        expect(pkg.layouts[1].xml).toContain("Layout 2");
        expect(pkg.layouts[1].xml).not.toContain("Layout 1");
        expect(pkg.layouts[1].xml.endsWith("</StackLayout>")).toBe(true);
    });

    it("LinearLayout | StackLayout が見つからない場合、空の LinearLayout を追加する", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <Text>Some other content</Text>
    <Button>Not a layout element</Button>
</LayoutXml>`;
        // YRTルート形式: ["YRT", 1, { l: [[null, xml]], s: null, a: null }]
        const yrtRoot = [
            "YRT",
            1,
            {
                l: [[null, inputXml]],
                s: null,
                a: null,
            },
        ];
        const result = multiple_xmls.migrate(yrtRoot);
        const pkg = yrtRootToPackage(result);

        expect(pkg.layouts.length).toBe(1);
        expect(pkg.layouts[0].xml).toBe("<LinearLayout></LinearLayout>");
        expect(pkg.layouts[0].name).toBe(null);
    });
});
