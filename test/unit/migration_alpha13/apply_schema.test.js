import { migrate } from "../../../src/migration_alpha13/apply_schema.mjs";

describe("XMLスキーマ指定用の属性追加 (apply_schema)", () => {
    it("レイアウトXMLにスキーマ属性を追加する", () => {
        const input = '<LinearLayout></LinearLayout>';
        const yrtDocument = { layouts: [input], style: null };
        const migrated = migrate(yrtDocument);
        const migratedXml = migrated.layouts[0];

        expect(migratedXml).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(migratedXml).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/layout.xsd"');
    });

    it("スタイルXMLにスキーマ属性を追加する", () => {
        const input = '<Style></Style>';
        const yrtDocument = { layouts: [], style: input };
        const migrated = migrate(yrtDocument);
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        const migratedStyle = migrated.style ?? "";

        expect(migratedStyle).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
        expect(migratedStyle).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2025.1/style.xsd"');
    });

    it("複数のレイアウトにスキーマ属性を追加する", () => {
        const layout1 = '<LinearLayout><Text /></LinearLayout>';
        const layout2 = '<StackLayout><Text x="0" y="0" width="100" /></StackLayout>';
        const yrtDocument = {
            layouts: [
                layout1,
                layout2],
            style: null,
        };
        const migrated = migrate(yrtDocument);

        expect(migrated.layouts[0]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(migrated.layouts[1]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
    });

    it("同一YRTルート内のレイアウトとスタイルXMLの両方を処理する", () => {
        const layoutXml = '<LinearLayout></LinearLayout>';
        const styleXml = '<Style></Style>';
        const yrtDocument = { layouts: [layoutXml], style: styleXml };
        const migrated = migrate(yrtDocument);

        expect(migrated.layouts[0]).toContain('https://schemas.yagisan.app/2025.1/layout.xsd');
        expect(typeof migrated.style === "string" && migrated.style.trim().length > 0).toBe(true);
        expect((migrated.style ?? "")).toContain('https://schemas.yagisan.app/2025.1/style.xsd');
    });
});
