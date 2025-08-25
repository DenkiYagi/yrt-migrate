import { isLegacyYrtFormat, isLegacyLayoutXml } from "./yrt_format_legacy.mjs";

describe("isLegacyLayoutXml", () => {
    it("ルート要素が <LayoutXml> の場合は true を返す", () => {
        const xml = `<LayoutXml><LinearLayout/></LayoutXml>`;
        expect(isLegacyLayoutXml(xml)).toBe(true);
    });
    it("ルート要素が <LayoutXml> でない場合は false を返す", () => {
        const xml = `<OtherRoot></OtherRoot>`;
        expect(isLegacyLayoutXml(xml)).toBe(false);
    });
    it("不正なXMLの場合は false を返す", () => {
        const xml = `<LayoutXml><LinearLayout></LayoutXml>`; // 閉じタグ不足
        expect(isLegacyLayoutXml(xml)).toBe(false);
    });
    it("空文字列の場合は false を返す", () => {
        expect(isLegacyLayoutXml("")).toBe(false);
    });

    it("ルート直前にコメントがあっても <LayoutXml> なら true を返す", () => {
        const xml = `<!-- comment --><LayoutXml><LinearLayout/></LayoutXml>`;
        expect(isLegacyLayoutXml(xml)).toBe(true);
    });

    it("ルート直前にXML宣言があってもルートが <LayoutXml> なら true を返す", () => {
        const xml = `<?xml version='1.0'?><LayoutXml><LinearLayout/></LayoutXml>`;
        expect(isLegacyLayoutXml(xml)).toBe(true);
    });

    it("<LayoutXml> が子要素の場合は false を返す", () => {
        const xml = `<Root><LayoutXml></LayoutXml></Root>`;
        expect(isLegacyLayoutXml(xml)).toBe(false);
    });

    it("<LayoutXml> が兄弟要素の場合は false を返す", () => {
        const xml = `<Root></Root><LayoutXml></LayoutXml>`;
        expect(isLegacyLayoutXml(xml)).toBe(false);
    });
});

describe("isLegacyYrtFormat", () => {
    it("[xml] でルートが <LayoutXml> の場合は true を返す", () => {
        const arr = ["<LayoutXml><LinearLayout/></LayoutXml>"];
        expect(isLegacyYrtFormat(arr)).toBe(true);
    });
    it("[xml, assets] でルートが <LayoutXml> の場合は true を返す", () => {
        const arr = ["<LayoutXml><LinearLayout/></LayoutXml>", { foo: new Uint8Array([1, 2, 3]) }];
        expect(isLegacyYrtFormat(arr)).toBe(true);
    });
    it("[xml] でルートが <LayoutXml> でない場合は false を返す", () => {
        const arr = ["<OtherRoot></OtherRoot>"];
        expect(isLegacyYrtFormat(arr)).toBe(false);
    });
    it("[xml, assets] でルートが <LayoutXml> でない場合は false を返す", () => {
        const arr = ["<OtherRoot></OtherRoot>", { foo: new Uint8Array([1, 2, 3]) }];
        expect(isLegacyYrtFormat(arr)).toBe(false);
    });
    it("[xml, null] の場合は false を返す", () => {
        const arr = ["<LayoutXml></LayoutXml>", null];
        expect(isLegacyYrtFormat(arr)).toBe(false);
    });
    it("[xml, オブジェクト以外] の場合は false を返す", () => {
        const arr = ["<LayoutXml></LayoutXml>", 123];
        expect(isLegacyYrtFormat(arr)).toBe(false);
    });
    it("配列でない入力の場合は false を返す", () => {
        expect(isLegacyYrtFormat(null)).toBe(false);
        expect(isLegacyYrtFormat({})).toBe(false);
        expect(isLegacyYrtFormat("<LayoutXml></LayoutXml>")).toBe(false);
    });
    it("配列長が不正な場合は false を返す", () => {
        expect(isLegacyYrtFormat([])).toBe(false);
        expect(isLegacyYrtFormat(["a", "b", "c"]))
            .toBe(false);
    });
    it("[文字列以外] の場合は false を返す", () => {
        expect(isLegacyYrtFormat([123])).toBe(false);
    });
});
