import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/borderstyle_dasharray_to_colon.mjs";

describe("borderStyle属性 dasharray()→コロン区切り変換マイグレーション", () => {
    it("スペースありのカンマ区切り2値がコロン区切りに変換される", () => {
        const xml = '<Rectangle borderStyle="dasharray(5, 2)" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("5:2");
    });

    it("スペースなしのカンマ区切り2値がコロン区切りに変換される", () => {
        const xml = '<Rectangle borderStyle="dasharray(10,2)" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("10:2");
    });

    it("カンマ区切り4値がコロン区切りに変換される", () => {
        const xml = '<Rectangle borderStyle="dasharray(1,2,3,4)" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("1:2:3:4");
    });

    it("dasharray() でなければ何もしない", () => {
        const xml = '<Rectangle borderStyle="solid" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("solid");
    });

    it("borderStyle属性がなければ何もしない", () => {
        const xml = '<Rectangle />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.hasAttribute("borderStyle")).toBe(false);
    });

    it("dasharray()の前後に空白があっても維持して変換される", () => {
        const xml = '<Rectangle borderStyle="   dasharray( 1 , 2 )   " />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("   1:2   ");
    });

    it("dasharrayが大文字・小文字混在でも変換される", () => {
        const xml = '<Rectangle borderStyle="DaShArRaY(7,8)" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("7:8");
    });

    it("borderStyle属性値に dasharray(...) が複数含まれる場合も全てコロン区切りに変換される", () => {
        const xml = '<Rectangle borderStyle="dasharray(1,2) dasharray(3,4)" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0].xml, "text/xml");
        expect(doc.documentElement.getAttribute("borderStyle")).toBe("1:2 3:4");
    });
});
