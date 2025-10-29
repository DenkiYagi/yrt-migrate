import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/warn_binding_required.mjs";

describe("バインド変数必須化マイグレーション (bindingRequiredWarn)", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("itemsがリテラル値なら警告", () => {
        const xml = `<Table items="[]" />`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("items属性はバインド変数で指定してください"));
    });

    it("breakConditionがリテラル値なら警告", () => {
        const xml = `<Table breakCondition="true" />`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("breakCondition属性はバインド変数で指定してください"));
    });

    it("items, breakCondition両方リテラルなら両方警告", () => {
        const xml = `<Table items="[]" breakCondition="true" />`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("items/breakConditionがバインド変数なら警告しない", () => {
        const xml = '<Table items="${foo.bar}" breakCondition="${baz[0]}" />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("items, breakConditionどちらも未指定なら警告しない", () => {
        const xml = `<Table />`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("items/breakCondition属性値に前後空白があっても正しく判定される", () => {
        const xml = '<Table items="  ${foo}  " breakCondition="  true  " />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        // itemsはバインド変数なので警告なし、breakConditionはリテラルなので警告
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("breakCondition属性はバインド変数で指定してください"));
    });

    it("items属性値が空白のみの場合は警告しない", () => {
        const xml = '<Table items="   " />';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
