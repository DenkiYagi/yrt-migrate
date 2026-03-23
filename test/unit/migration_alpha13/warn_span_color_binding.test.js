import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../../src/migration_alpha13/warn_span_color_binding.mjs";
import { setupWarningSpy } from "../../helpers/warning_spy.js";

describe("<Span> color属性テンプレート変数警告マイグレーション", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("color属性がテンプレート変数の場合に警告が出る", () => {
        const xml = '<RichText><Span color="${foo}">text</Span></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("Span要素のcolor属性にテンプレート変数を指定することはできなくなりました")]));
    });

    it("color属性値に前後空白があってもテンプレート変数なら警告が出る", () => {
        const xml = '<RichText><Span color="   ${foo}   ">text</Span></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("Span要素のcolor属性にテンプレート変数を指定することはできなくなりました")]));
    });

    it("color属性が静的値の場合は警告が出ない", () => {
        const xml = `<RichText><Span color="#FF0000">text</Span></RichText>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("color属性が未指定の場合は警告が出ない", () => {
        const xml = `<RichText><Span>text</Span></RichText>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("複数の<Span>でテンプレート変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="${foo}"/><Span color="${bar}"/></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(2);
    });

    it("入れ子の<Span>でテンプレート変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="#000000">outer<Span color="${foo}">inner</Span></Span></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("Span要素のcolor属性にテンプレート変数を指定することはできなくなりました");
    });

    it("複数XMLでそれぞれのcolor属性テンプレート変数に警告が出る", () => {
        const xml = '<LayoutXml><RichText><Span color="${foo}">text1</Span></RichText><RichText><Span color="${bar}">text2</Span></RichText></LayoutXml>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(2);
        expect(warnings.every(msg => msg.includes("Span要素のcolor属性にテンプレート変数を指定することはできなくなりました"))).toBe(true);
    });
});
