import { migrate } from "./apply_schema.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("XMLスキーマ指定用の属性追加 (apply_schema)", () => {
    it("レイアウトXMLにスキーマ属性を追加する", () => {
        const input = '<LinearLayout></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const migratedXml = layouts[0];

        expect(migratedXml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(migratedXml).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/layout.xsd"');
    });

    it("スタイルXMLにスキーマ属性を追加する", () => {
        const input = '<Style></Style>';
        const yrtRoot = toYrtRoot({ layouts: [], styleXml: input });
        const migrated = migrate(yrtRoot);
        const { styleXml } = fromYrtRoot(migrated);

        expect(styleXml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(styleXml).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/style.xsd"');
    });

    it("複数のレイアウトにスキーマ属性を追加する", () => {
        const layout1 = '<LinearLayout><Text /></LinearLayout>';
        const layout2 = '<StackLayout><Text x="0" y="0" width="100" /></StackLayout>';
        const yrtRoot = toYrtRoot({ layouts: [layout1, layout2] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);

        expect(layouts[0]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(layouts[1]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
    });

    it("同一YRTルート内のレイアウトとスタイルXMLの両方を処理する", () => {
        const layoutXml = '<LinearLayout></LinearLayout>';
        const styleXml = '<Style></Style>';
        const yrtRoot = toYrtRoot({ layouts: [layoutXml], styleXml });
        const migrated = migrate(yrtRoot);
        const { layouts, styleXml: migratedStyle } = fromYrtRoot(migrated);

        expect(layouts[0]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(migratedStyle).toContain('https://schemas.yagisan.app/2025.1/style.xsd');
    });
});
