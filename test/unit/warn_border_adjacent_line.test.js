import { jest } from '@jest/globals';
import { migrate } from "../../src/migrate/warn_border_adjacent_line.mjs";

describe("border_adjacent_line_warning（レイアウト隣接罫線警告）", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("LayoutHeaderにborderThickness属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutHeader borderThickness="1"/></LinearLayout>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutHeader 要素")
        );
    });

    it("LayoutBodyにborderColor属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutBody borderColor="#000"/></LinearLayout>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutBody 要素")
        );
    });

    it("LayoutFooterにborderStyle属性があれば警告する", () => {
        const xml = `<LinearLayout><LayoutFooter borderStyle="solid"/></LinearLayout>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutFooter 要素")
        );
    });

    it("対象属性がなければ警告しない", () => {
        const xml = `<LinearLayout><LayoutHeader/><LayoutBody/><LayoutFooter/></LinearLayout>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("複数要素に対象属性があればそれぞれ警告する", () => {
        const xml = `<LinearLayout><LayoutHeader borderThickness="1"/><LayoutBody borderColor="#000"/></LinearLayout>`;
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });
});
