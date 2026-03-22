import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../../src/migration_alpha13/warn_linear_layout_children_border.mjs";
import { setupWarningSpy } from "../../helpers/warning_spy.js";

describe("border_adjacent_line_warning（レイアウト隣接罫線警告）", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("LayoutHeaderにborderThickness属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutHeader borderThickness="1"/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([
            expect.stringContaining("LayoutHeader要素に")
        ]));
    });

    it("LayoutBodyにborderColor属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutBody borderColor="#000"/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([
            expect.stringContaining("LayoutBody要素に")
        ]));
    });

    it("LayoutFooterにborderStyle属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutFooter borderStyle="solid"/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([
            expect.stringContaining("LayoutFooter要素に")
        ]));
    });

    it("対象属性がなければ警告しない", () => {
        const xml = `<LinearLayout><LayoutHeader/><LayoutBody/><LayoutFooter/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("複数要素に対象属性があればそれぞれ警告する", () => {
        const xml = `<LinearLayout><LayoutHeader borderThickness="1"/><LayoutBody borderColor="#000"/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(2);
    });
});
