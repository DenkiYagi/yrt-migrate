import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/warn_image_width_required.mjs";
import { setupWarningSpy } from "../helpers/warning_spy.js";

describe("<Image> width属性必須化マイグレーション", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("width属性がある場合は警告なし", () => {
        const input = '<Image width="100" />';
        const doc = new DOMParser().parseFromString(input, "text/xml");
        migrate(doc, input);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("width属性がない場合は警告が出る", () => {
        const input = '<Image />';
        const doc = new DOMParser().parseFromString(input, "text/xml");
        migrate(doc, input);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("Image要素にwidth属性がありません")]));
    });

    it("複数Image要素でwidth属性なしが混在する場合、警告が出る", () => {
        const input = '<root><Image width="100" /><Image /><Image width="200" /><Image /></root>';
        const doc = new DOMParser().parseFromString(input, "text/xml");
        migrate(doc, input);
        // 2回警告が出ることを検証
        const warnings = warningSpy.messages();
        expect(warnings.filter(msg => msg.includes("Image要素にwidth属性がありません"))).toHaveLength(2);
    });
});
