import { migrate } from "./orientation_rename.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("orientation_rename", () => {
    it("orientation=horizontal を landscape に変換する", () => {
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <LinearLayout orientation="horizontal">\n    <Text>test</Text>\n  </LinearLayout>\n</LayoutXml>';
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('orientation="landscape"');
        expect(layouts[0]).not.toContain('orientation="horizontal"');
    });

    it("orientation=vertical を portrait に変換する", () => {
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <LinearLayout orientation="vertical">\n    <Text>test</Text>\n  </LinearLayout>\n</LayoutXml>';
        const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
        const { layouts } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('orientation="portrait"');
        expect(layouts[0]).not.toContain('orientation="vertical"');
    });

    it("レイアウトが2つあっても両方正しく変換される", () => {
        const inputXml1 = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <LinearLayout orientation="horizontal">\n    <Text>test1</Text>\n  </LinearLayout>\n</LayoutXml>';
        const inputXml2 = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <LinearLayout orientation="vertical">\n    <Text>test2</Text>\n  </LinearLayout>\n</LayoutXml>';
        const yrt = migrate(toYrtRoot({ layouts: [inputXml1, inputXml2] }));
        const { layouts } = fromYrtRoot(yrt);
        expect(layouts[0]).toContain('orientation="landscape"');
        expect(layouts[0]).not.toContain('orientation="horizontal"');
        expect(layouts[1]).toContain('orientation="portrait"');
        expect(layouts[1]).not.toContain('orientation="vertical"');
    });
});
