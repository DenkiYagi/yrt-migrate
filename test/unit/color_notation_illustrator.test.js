import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/color_notation_illustrator.mjs";
import { toYrtRoot, fromYrtRoot } from "../../src/utils.js";

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

        it("color='grayscale( 0.5 )'（空白あり）→ color='K50'", () => {
            const xml = `<Text color="grayscale(  0.5  )"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K50"');
        });
        it("color='GrAyScAlE(0.5)'（大文字・小文字混在）→ color='K50'", () => {
            const xml = `<Text color="GrAyScAlE(0.5)"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="K50"');
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

        it("color='rgb( 0.0 , 0.5 , 1.0 )'（空白あり）→ color='R0G50B100'", () => {
            const xml = `<Text color="rgb( 0.0 , 0.5 , 1.0 )"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="R0G50B100"');
        });
        it("color='RgB(0.0,0.5,1.0)'（大文字・小文字混在）→ color='R0G50B100'", () => {
            const xml = `<Text color="RgB(0.0,0.5,1.0)"/>`;
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

        it("color='cmyk( 0.0 , 0.5 , 1.0 , 0.25 )'（空白あり）→ color='C0M50Y100K25'", () => {
            const xml = `<Text color="cmyk( 0.0 , 0.5 , 1.0 , 0.25 )"/>`;
            const yrtRoot = toYrtRoot({ layouts: [xml] });
            const migrated = migrate(yrtRoot);
            const { layouts } = fromYrtRoot(migrated);
            const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
            const out = new XMLSerializer().serializeToString(doc.documentElement);
            expect(out).toContain('color="C0M50Y100K25"');
        });
        it("color='CmYk(0.0,0.5,1.0,0.25)'（大文字・小文字混在）→ color='C0M50Y100K25'", () => {
            const xml = `<Text color="CmYk(0.0,0.5,1.0,0.25)"/>`;
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

    describe("4方向系カラー属性のスペース区切り複数値", () => {
        it("4方向系カラー属性がスペース区切りで複数値の場合、すべて変換される", () => {
            const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid borderColor="grayscale(0.0) grayscale(0.5) grayscale(1.0)" outerBorderColor="rgb(1,0,0) rgb(0,1,0) rgb(0,0,1)">\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>';
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { layouts } = fromYrtRoot(yrt);
            // borderColor: K100 K50 K0, outerBorderColor: R100G0B0 R0G100B0 R0G0B100
            expect(layouts[0]).toContain('borderColor="K100 K50 K0"');
            expect(layouts[0]).toContain('outerBorderColor="R100G0B0 R0G100B0 R0G0B100"');
        });

        it("4方向系カラー属性がスペース複数区切りでもすべて変換される", () => {
            const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<LayoutXml>\n  <Grid borderColor="grayscale(0.0)   grayscale(1.0)" outerBorderColor="rgb(1,0,0)   rgb(0,0,1)">\n    <Text>test</Text>\n  </Grid>\n</LayoutXml>';
            const yrt = migrate(toYrtRoot({ layouts: [inputXml] }));
            const { layouts } = fromYrtRoot(yrt);
            expect(layouts[0]).toContain('borderColor="K100 K0"');
            expect(layouts[0]).toContain('outerBorderColor="R100G0B0 R0G0B100"');
        });
    });
});
