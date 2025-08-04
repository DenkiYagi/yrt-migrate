import { jest } from '@jest/globals';
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { migrate } from "./color_notation_illustrator.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("カラー記法のIllustrator寄り変換マイグレーション", () => {
    describe("grayscale → K記法", () => {
        it("color='grayscale(0.0)' → color='K100'", () => {
            const xml = `<Text color="grayscale(0.0)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K100"');
        });
        it("color='grayscale(1.0)' → color='K0'", () => {
            const xml = `<Text color="grayscale(1.0)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K0"');
        });
        it("color='grayscale(0.5)' → color='K50'", () => {
            const xml = `<Text color="grayscale(0.5)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K50"');
        });
        it("color='grayscale(0.123)' → color='K88'", () => {
            const xml = `<Text color="grayscale(0.123)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K88"');
        });
    });
    describe("rgb → RxGxBx記法", () => {
        it("color='rgb(0.0,0.5,1.0)' → color='R0G50B100'", () => {
            const xml = `<Text color="rgb(0.0,0.5,1.0)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="R0G50B100"');
        });
    });
    describe("cmyk → CxMxYxKx記法", () => {
        it("color='cmyk(0.0,0.5,1.0,0.25)' → color='C0M50Y100K25'", () => {
            const xml = `<Text color="cmyk(0.0,0.5,1.0,0.25)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="C0M50Y100K25"');
        });
    });
    describe("変換対象外はそのまま", () => {
        it("color='K80' は変換されない", () => {
            const xml = `<Text color="K80"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K80"');
        });
    });
    describe("全属性網羅（一般）", () => {
        it("borderColor, outerBorderColor, backgroundColorも変換", () => {
            const xml = `<Rectangle borderColor="grayscale(0.5)" outerBorderColor="rgb(1.0,0,0)" backgroundColor="cmyk(0,0,0,1.0)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('borderColor="K50"');
            expect(out).toContain('outerBorderColor="R100G0B0"');
            expect(out).toContain('backgroundColor="C0M0Y0K100"');
        });
    });

    describe("全属性網羅（Table系特殊）", () => {
        it("headerBackgroundColor, footerBackgroundColorも変換", () => {
            const xml = `<Table headerBackgroundColor="grayscale(0.2)" footerBackgroundColor="rgb(0.1,0.2,0.3)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('headerBackgroundColor="K80"');
            expect(out).toContain('footerBackgroundColor="R10G20B30"');
        });
    });
});
