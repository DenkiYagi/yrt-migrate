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
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("foreach属性とhidden属性が同時に指定されている")]));
    });

    it("foreachがバインド変数でなければ警告する", () => {
        const inputXml = '<Grid foreach="items"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('foreach属性の値 "items" はバインド変数ではありません')]));
    });

    it("hiddenがバインド変数でなければ警告する", () => {
        const inputXml = '<Text hidden="true"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('hidden属性の値 "true" はバインド変数ではありません')]));
    });

    it("バインド変数のforeach/hiddenのみの場合は警告しない", () => {
        const inputXml = '<Grid foreach="${items}"><Text hidden="${flag}"/></Grid>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("属性値が空文字の場合は警告しない", () => {
        const inputXml = '<Grid foreach=""><Text hidden=" "/></Grid>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warningSpy.messages()).toHaveLength(0);
    });
});
