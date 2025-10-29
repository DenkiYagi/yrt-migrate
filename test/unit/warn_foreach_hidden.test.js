import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/warn_foreach_hidden.mjs";

describe("warn_foreach_hidden", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("foreachとhiddenが同時指定された場合に警告する", () => {
        const inputXml = '<Grid foreach="${items}" hidden="flag"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("foreach属性とhidden属性が同時に指定されている"));
    });

    it("foreachがバインド変数でなければ警告する", () => {
        const inputXml = '<Grid foreach="items"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('foreach属性の値 "items" はバインド変数ではありません'));
    });

    it("hiddenがバインド変数でなければ警告する", () => {
        const inputXml = '<Text hidden="true"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('hidden属性の値 "true" はバインド変数ではありません'));
    });

    it("バインド変数のforeach/hiddenのみの場合は警告しない", () => {
        const inputXml = '<Grid foreach="${items}"><Text hidden="${flag}"/></Grid>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("属性値が空文字の場合は警告しない", () => {
        const inputXml = '<Grid foreach=""><Text hidden=" "/></Grid>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(warnSpy).not.toHaveBeenCalled();
    });
});
