import { jest } from '@jest/globals';
import { migrate } from "./remove_deprecated_layout_attrs.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("レイアウト変更の可能性のある属性の廃止", () => {
    it("LinearLayoutのborder系属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<LinearLayout borderThickness="1" borderColor="#000" borderStyle="solid"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).not.toContain("borderThickness");
        expect(xml).not.toContain("borderColor");
        expect(xml).not.toContain("borderStyle");
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('LinearLayoutのborder系属性（borderThickness, borderColor, borderStyle）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。'));
        spy.mockRestore();
    });

    it("StackLayoutのborder系・padding属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<StackLayout borderThickness="2" borderColor="#111" borderStyle="dashed" padding="4"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).not.toContain("borderThickness");
        expect(xml).not.toContain("borderColor");
        expect(xml).not.toContain("borderStyle");
        expect(xml).not.toContain("padding");
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('StackLayoutのborder系属性・padding属性（borderThickness, borderColor, borderStyle, padding）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。'));
        spy.mockRestore();
    });

    it("StackBlockのpadding属性を削除し警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<StackBlock padding="8"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).not.toContain("padding");
        expect(spy).toHaveBeenCalledWith(expect.stringContaining('StackBlockのpadding属性は廃止されました。レイアウトが変わる可能性があるため手直ししてください。'));
        spy.mockRestore();
    });

    it("対象外の属性・要素は警告も削除もされない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        // LinearLayoutの子にStackBlockを持つ、スキーマに準拠した構造
        const inputXml = '<LinearLayout foo="bar"><StackBlock hoge="fuga"/></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('foo="bar"');
        expect(xml).toContain('hoge="fuga"');
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
