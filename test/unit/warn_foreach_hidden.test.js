import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/warn_foreach_hidden.mjs";
import { setupWarningSpy } from "../helpers/warning_spy.js";

describe("warn_foreach_hidden", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("foreachとhiddenが同時指定された場合に警告する", () => {
        const inputXml = '<Grid foreach="${items}" hidden="flag"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");
        migrate(warningSpy.diagnostics, doc, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("foreach属性とhidden属性が同時に指定されている場合は自動変換できません")]));
    });

    it("foreachがテンプレート変数でなければ警告する", () => {
        const inputXml = '<Grid foreach="items"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");
        migrate(warningSpy.diagnostics, doc, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('logic属性が導入されました')]));
    });

    it("hiddenがテンプレート変数でなければ警告する", () => {
        const inputXml = '<Text hidden="true"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");
        migrate(warningSpy.diagnostics, doc, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('logic属性が導入されました')]));
    });

    it("テンプレート変数のforeach/hiddenのみの場合は警告しない", () => {
        const inputXml = '<Grid foreach="${items}"><Text hidden="${flag}"/></Grid>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");
        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("属性値が空文字の場合は警告しない", () => {
        const inputXml = '<Grid foreach=""><Text hidden=" "/></Grid>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");
        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).toHaveLength(0);
    });
});
