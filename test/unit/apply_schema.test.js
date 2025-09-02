import { migrate } from "../../src/migrate/apply_schema.mjs";

describe("XMLスキーマ指定用の属性追加 (apply_schema)", () => {
    it("レイアウトXMLにスキーマ属性を追加する", () => {
        const input = '<LinearLayout></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const migratedXml = migrated.layouts[0].xml;

        expect(migratedXml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(migratedXml).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/layout.xsd"');
    });

    it("スタイルXMLにスキーマ属性を追加する", () => {
        const input = '<Style></Style>';
        const yrtDocument = { layouts: [], style: input, assets: null };
        const migrated = migrate(yrtDocument);
        const migratedStyle = migrated.style;

        expect(migratedStyle).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(migratedStyle).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/style.xsd"');
    });

    it("複数のレイアウトにスキーマ属性を追加する", () => {
        const layout1 = '<LinearLayout><Text /></LinearLayout>';
        const layout2 = '<StackLayout><Text x="0" y="0" width="100" /></StackLayout>';
        const yrtDocument = {
            layouts: [
                { name: null, xml: layout1 },
                { name: null, xml: layout2 }
            ],
            style: null,
            assets: null,
        };
        const migrated = migrate(yrtDocument);

        expect(migrated.layouts[0].xml).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(migrated.layouts[1].xml).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
    });

    it("同一YRTルート内のレイアウトとスタイルXMLの両方を処理する", () => {
        const layoutXml = '<LinearLayout></LinearLayout>';
        const styleXml = '<Style></Style>';
        const yrtDocument = { layouts: [{ name: null, xml: layoutXml }], style: styleXml, assets: null };
        const migrated = migrate(yrtDocument);

        expect(migrated.layouts[0].xml).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(migrated.style).toContain('https://schemas.yagisan.app/2025.1/style.xsd');
    });
});
