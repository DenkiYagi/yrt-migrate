import { jest } from "@jest/globals";
import { migrate } from "../../src/migrate/image_width_required.mjs";
import { toYrtRoot } from "../../src/utils.js";

describe("<Image> width属性必須化マイグレーション", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("width属性がある場合は警告なし", () => {
        const input = `<Image width="100" />`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        migrate(yrtRoot);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("width属性がない場合は警告が出る", () => {
        const input = `<Image />`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Image要素にwidth属性がありません"));
    });

    it("複数Image要素でwidth属性なしが混在する場合、警告が出る", () => {
        const input = `<root><Image width="100" /><Image /><Image width="200" /><Image /></root>`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        migrate(yrtRoot);
        // 2回警告が出ることを検証
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(1, expect.stringContaining("Image要素にwidth属性がありません"));
        expect(warnSpy).toHaveBeenNthCalledWith(2, expect.stringContaining("Image要素にwidth属性がありません"));
    });
});
