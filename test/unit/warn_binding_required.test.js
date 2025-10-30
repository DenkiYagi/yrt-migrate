import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/warn_binding_required.mjs";
import { setupWarningSpy } from "../helpers/warning_spy.js";

describe("バインド変数必須化マイグレーション (bindingRequiredWarn)", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("itemsがリテラル値なら警告", () => {
        const xml = `<Table items="[]" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("items属性では固定値を指定できなくなりました")]));
    });

    it("breakConditionがリテラル値なら警告", () => {
        const xml = `<Table breakCondition="true" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("breakCondition属性では固定値を指定できなくなりました")]));
    });

    it("items, breakCondition両方リテラルなら両方警告", () => {
        const xml = `<Table items="[]" breakCondition="true" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(2);
    });

    it("items/breakConditionがバインド変数なら警告しない", () => {
        const xml = '<Table items="${foo.bar}" breakCondition="${baz[0]}" />';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("items, breakConditionどちらも未指定なら警告しない", () => {
        const xml = `<Table />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("items/breakCondition属性値に前後空白があっても正しく判定される", () => {
        const xml = '<Table items="  ${foo}  " breakCondition="  true  " />';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        // itemsはバインド変数なので警告なし、breakConditionはリテラルなので警告
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("breakCondition属性では固定値を指定できなくなりました");
    });

    it("items属性値が空白のみの場合は警告しない", () => {
        const xml = '<Table items="   " />';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });
});
