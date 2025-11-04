import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/size_comma_to_space.mjs";

describe("<LinearLayout>/<StackLayout> size属性 カンマ→スペース変換マイグレーション", () => {
    it("カンマ区切りをスペース区切りに変換する", () => {
        const xml = '<LinearLayout size="10, 20" />';
        const yrtDocument = { layouts: [xml], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10 20");
    });
    it("スペース区切りはそのまま", () => {
        const xml = '<StackLayout size="10 20" />';
        const yrtDocument = { layouts: [xml], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10 20");
    });
    it("カンマがなければ何もしない", () => {
        const xml = '<LinearLayout size="10" />';
        const yrtDocument = { layouts: [xml], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        expect(doc.documentElement.getAttribute("size")).toBe("10");
    });
    it("size属性がなければ何もしない", () => {
        const xml = '<StackLayout />';
        const yrtDocument = { layouts: [xml], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        expect(doc.documentElement.hasAttribute("size")).toBe(false);
    });
});
