import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/size_comma_to_space.mjs";
import { toYrtRoot, fromYrtRoot } from "../../src/utils.js";

describe("<LinearLayout>/<StackLayout> size属性 カンマ→スペース変換マイグレーション", () => {
    it("カンマ区切りをスペース区切りに変換する", () => {
        const xml = '<LinearLayout size="10, 20" />';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10 20");
    });
    it("スペース区切りはそのまま", () => {
        const xml = '<StackLayout size="10 20" />';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10 20");
    });
    it("カンマがなければ何もしない", () => {
        const xml = '<LinearLayout size="10" />';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10");
    });
    it("size属性がなければ何もしない", () => {
        const xml = '<StackLayout />';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        expect(doc.documentElement.hasAttribute("size")).toBe(false);
    });
});
