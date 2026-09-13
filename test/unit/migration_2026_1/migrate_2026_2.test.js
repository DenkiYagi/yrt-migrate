import { detectXmlType, migrateTo2026_2 } from "../../../src/migration_2026_1/migrate_2026_2.mjs";

describe("detectXmlType", () => {
    it.each([
        ["LinearLayout", '<LinearLayout orientation="portrait"/>'],
        ["StackLayout", '<StackLayout/>'],
    ])("%sをlayoutと判定する", (_tag, xml) => {
        expect(detectXmlType(xml)).toBe("layout");
    });

    it("Styleをstyleと判定する", () => {
        expect(detectXmlType('<Style/>')).toBe("style");
    });

    it("未対応のルート要素でエラーを投げる", () => {
        expect(() => detectXmlType('<Unknown/>')).toThrow("未対応のルート要素です");
    });

    it("不正なXMLでエラーを投げる", () => {
        expect(() => detectXmlType("not xml")).toThrow();
    });
});

describe("migrateTo2026_2", () => {
    describe.each([
        ["LinearLayout"],
        ["StackLayout"],
    ])("%s", (tag) => {
        it("スキーマ属性がないlayoutに2026.2のスキーマを追加する", () => {
            const input = `<${tag} orientation="portrait"><LayoutBody/></${tag}>`;
            const result = migrateTo2026_2(input, "layout");

            expect(result).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
            expect(result).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.2/layout.xsd"');
            expect(result).toContain('orientation="portrait"');
        });

        it("2026.1のスキーマを2026.2に置換する", () => {
            const input = `<${tag} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.1/layout.xsd" orientation="portrait"/>`;
            const result = migrateTo2026_2(input, "layout");

            expect(result).toContain('https://schemas.yagisan.app/2026.2/layout.xsd');
            expect(result).not.toContain('https://schemas.yagisan.app/2026.1/layout.xsd');
        });

        it("スキーマ属性が先頭に配置される", () => {
            const input = `<${tag} orientation="portrait"/>`;
            const result = migrateTo2026_2(input, "layout");

            const xsiPos = result.indexOf('xmlns:xsi=');
            const orientationPos = result.indexOf('orientation=');
            expect(xsiPos).toBeLessThan(orientationPos);
        });
    });

    describe("Style", () => {
        it("スキーマ属性がないstyleに2026.2のスキーマを追加する", () => {
            const input = '<Style><CellRangeList key="style-1"/></Style>';
            const result = migrateTo2026_2(input, "style");

            expect(result).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
            expect(result).toContain('xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.2/style.xsd"');
            expect(result).toContain('<CellRangeList');
        });

        it("2026.1のスキーマを2026.2に置換する", () => {
            const input = '<Style xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.1/style.xsd"/>';
            const result = migrateTo2026_2(input, "style");

            expect(result).toContain('https://schemas.yagisan.app/2026.2/style.xsd');
            expect(result).not.toContain('https://schemas.yagisan.app/2026.1/style.xsd');
        });
    });
});
