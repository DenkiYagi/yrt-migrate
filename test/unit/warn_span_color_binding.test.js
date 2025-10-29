import { migrate } from "../../src/migrate/warn_span_color_binding.mjs";
import { setupWarningSpy } from "../helpers/warning_spy.js";

describe("<Span> color属性バインド変数警告マイグレーション", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("color属性がバインド変数の場合に警告が出る", () => {
        const xml = '<RichText><Span color="${foo}">text</Span></RichText>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("<Span>のcolor属性にバインド変数は指定できません")]));
    });

    it("color属性値に前後空白があってもバインド変数なら警告が出る", () => {
        const xml = '<RichText><Span color="   ${foo}   ">text</Span></RichText>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("<Span>のcolor属性にバインド変数は指定できません")]));
    });

    it("color属性が静的値の場合は警告が出ない", () => {
        const xml = `<RichText><Span color="#FF0000">text</Span></RichText>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("color属性が未指定の場合は警告が出ない", () => {
        const xml = `<RichText><Span>text</Span></RichText>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("複数の<Span>でバインド変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="${foo}"/><Span color="${bar}"/></RichText>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(2);
    });

    it("入れ子の<Span>でバインド変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="#000000">outer<Span color="${foo}">inner</Span></Span></RichText>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toContain("<Span>のcolor属性にバインド変数は指定できません");
    });

    it("複数XMLでそれぞれのcolor属性バインド変数に警告が出る", () => {
        const xml1 = '<RichText><Span color="${foo}">text1</Span></RichText>';
        const xml2 = '<RichText><Span color="${bar}">text2</Span></RichText>';
        const yrtDocument = {
            layouts: [
                { name: null, xml: xml1 },
                { name: null, xml: xml2 }
            ], style: null, assets: null
        };
        migrate(yrtDocument);
        const warnings = warningSpy.messages();
        expect(warnings).toHaveLength(2);
        expect(warnings.every(msg => msg.includes("<Span>のcolor属性にバインド変数は指定できません"))).toBe(true);
    });
});
