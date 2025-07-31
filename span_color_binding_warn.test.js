import { jest } from "@jest/globals";
import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "./span_color_binding_warn.mjs";

describe("<Span> color属性バインド変数警告マイグレーション", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("color属性がバインド変数の場合に警告が出る", () => {
        const xml = '<RichText><Span color="${foo}">text</Span></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Span>のcolor属性にバインド変数は指定できません"));
    });

    it("color属性が静的値の場合は警告が出ない", () => {
        const xml = `<RichText><Span color="#FF0000">text</Span></RichText>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("color属性が未指定の場合は警告が出ない", () => {
        const xml = `<RichText><Span>text</Span></RichText>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("複数の<Span>でバインド変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="${foo}"/><Span color="${bar}"/></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("入れ子の<Span>でバインド変数指定があれば全て警告", () => {
        const xml = '<RichText><Span color="#000000">outer<Span color="${foo}">inner</Span></Span></RichText>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Span>のcolor属性にバインド変数は指定できません"));
    });
});
