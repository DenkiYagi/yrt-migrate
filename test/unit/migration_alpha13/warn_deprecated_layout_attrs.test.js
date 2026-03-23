import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../../src/migration_alpha13/warn_deprecated_layout_attrs.mjs";
import { setupWarningSpy } from "../../helpers/warning_spy.js";

describe("warn_deprecated_layout_attrs", () => {
    it("LinearLayoutのborder系属性が残ったまま警告される", () => {
        const warningSpy = setupWarningSpy();
        const inputXml = '<LinearLayout borderThickness="1" borderColor="#000" borderStyle="solid"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");

        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).not.toHaveLength(0);
        warningSpy.restore();
    });

    it("StackLayoutのborder系・padding属性も削除されず警告だけが出る", () => {
        const warningSpy = setupWarningSpy();
        const inputXml = '<StackLayout borderThickness="2" borderColor="#111" borderStyle="dashed" padding="4"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");

        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).not.toHaveLength(0);
        warningSpy.restore();
    });

    it("StackBlockのpaddingも削除されない", () => {
        const warningSpy = setupWarningSpy();
        const inputXml = '<StackBlock padding="8"/>';
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");

        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).not.toHaveLength(0);
        warningSpy.restore();
    });

    it("対象外の要素が含まれている場合は警告されない", () => {
        const warningSpy = setupWarningSpy();
        const inputXml = [
            '<LinearLayout foo="bar">',
            '  <StackBlock hoge="fuga"/>',
            '</LinearLayout>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(inputXml, "text/xml");

        migrate(warningSpy.diagnostics, doc, inputXml);

        expect(warningSpy.messages()).toHaveLength(0);
        warningSpy.restore();
    });
});
