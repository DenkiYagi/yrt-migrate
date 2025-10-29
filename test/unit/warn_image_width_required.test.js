import { jest } from "@jest/globals";
import { migrate } from "../../src/migrate/warn_image_width_required.mjs";

describe("<Image> width属性必須化マイグレーション", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("width属性がある場合は警告なし", () => {
        const input = '<Image width="100" />';
        const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
        migrate(yrtDocument, input);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("width属性がない場合は警告が出る", () => {
        const input = '<Image />';
        const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
        migrate(yrtDocument, input);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Image要素にwidth属性がありません"));
    });

    it("複数Image要素でwidth属性なしが混在する場合、警告が出る", () => {
        const input = '<root><Image width="100" /><Image /><Image width="200" /><Image /></root>';
        const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
        migrate(yrtDocument, input);
        // 2回警告が出ることを検証
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(1, expect.stringContaining("Image要素にwidth属性がありません"));
        expect(warnSpy).toHaveBeenNthCalledWith(2, expect.stringContaining("Image要素にwidth属性がありません"));
    });
});
