import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/warn_deprecated_layout_attrs.mjs";

describe("warn_deprecated_layout_attrs", () => {
    it("LinearLayoutのborder系属性が残ったまま警告される", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<LinearLayout borderThickness="1" borderColor="#000" borderStyle="solid"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(spy).toHaveBeenCalled();
        expect(yrtDocument.layouts[0].xml).toBe(inputXml);
        spy.mockRestore();
    });

    it("StackLayoutのborder系・padding属性も削除されず警告だけが出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<StackLayout borderThickness="2" borderColor="#111" borderStyle="dashed" padding="4"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(spy).toHaveBeenCalled();
        expect(yrtDocument.layouts[0].xml).toBe(inputXml);
        spy.mockRestore();
    });

    it("StackBlockのpaddingも削除されない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<StackBlock padding="8"/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(spy).toHaveBeenCalled();
        expect(yrtDocument.layouts[0].xml).toBe(inputXml);
        spy.mockRestore();
    });

    it("対象外の要素が含まれている場合は警告されない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = [
            '<LinearLayout foo="bar">',
            '  <StackBlock hoge="fuga"/>',
            '</LinearLayout>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };

        migrate(yrtDocument, inputXml);

        expect(spy).not.toHaveBeenCalled();
        expect(yrtDocument.layouts[0].xml).toBe(inputXml);
        spy.mockRestore();
    });
});
