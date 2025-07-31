import { jest } from '@jest/globals';
import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "./binding_required_warn.mjs";

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
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("items属性はバインド変数で指定してください"));
    });

    it("breakConditionがリテラル値なら警告", () => {
        const xml = `<Table breakCondition="true" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("breakCondition属性はバインド変数で指定してください"));
    });

    it("items, breakCondition両方リテラルなら両方警告", () => {
        const xml = `<Table items="[]" breakCondition="true" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("items/breakConditionがバインド変数なら警告しない", () => {
        const xml = '<Table items="${foo.bar}" breakCondition="${baz[0]}" />';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("items, breakConditionどちらも未指定なら警告しない", () => {
        const xml = `<Table />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
