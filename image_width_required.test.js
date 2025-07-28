import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "./image_width_required.mjs";

describe("<Image> width属性必須化マイグレーション", () => {
    it("width属性がある場合は警告なし", () => {
        const xml = `<Image width="100" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const warnings = [];
        migrate(doc, null, warnings);
        expect(warnings.length).toBe(0);
    });

    it("width属性がない場合は警告が出る", () => {
        const xml = `<Image />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const warnings = [];
        migrate(doc, null, warnings);
        expect(warnings.some(w => w.includes("Image要素にwidth属性がありません"))).toBe(true);
    });

    it("複数Image要素でwidth属性なしが混在する場合、警告が出る", () => {
        const xml = `<root><Image width="100" /><Image /><Image width="200" /><Image /></root>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const warnings = [];
        migrate(doc, null, warnings);
        expect(warnings.filter(w => w.includes("Image要素にwidth属性がありません")).length).toBe(2);
    });
});
