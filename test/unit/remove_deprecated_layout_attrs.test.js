import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/remove_deprecated_layout_attrs.mjs";

describe("レイアウト変更の可能性のある属性の廃止", () => {
    it("LinearLayoutのborder系属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = [
            '<LinearLayout borderThickness="1" borderColor="#000" borderStyle="solid"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const xml = migrated.layouts[0].xml;
        expect(xml).not.toContain("borderThickness");
        expect(xml).not.toContain("borderColor");
        expect(xml).not.toContain("borderStyle");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("StackLayoutのborder系・padding属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = [
            '<StackLayout borderThickness="2" borderColor="#111" borderStyle="dashed" padding="4"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const xml = migrated.layouts[0].xml;
        expect(xml).not.toContain("borderThickness");
        expect(xml).not.toContain("borderColor");
        expect(xml).not.toContain("borderStyle");
        expect(xml).not.toContain("padding");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("StackBlockのpadding属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = [
            '<StackBlock padding="8"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const xml = migrated.layouts[0].xml;
        expect(xml).not.toContain("padding");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("対象外の属性・要素は警告も削除もされない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        // LinearLayoutの子にStackBlockを持つ、スキーマに準拠した構造
        const inputXml = [
            '<LinearLayout foo="bar">',
            '  <StackBlock hoge="fuga"/>',
            '</LinearLayout>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('foo="bar"');
        expect(xml).toContain('hoge="fuga"');
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
