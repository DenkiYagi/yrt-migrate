import { isAssetsObject } from "./yrt_format_legacy.mjs";
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
        const xml = `Invalid text`;
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

describe("isAssetsObject", () => {
    it("すべての値が Uint8Array のオブジェクトの場合は true を返す", () => {
        const obj = { a: new Uint8Array([1]), b: new Uint8Array([2, 3]) };
        expect(isAssetsObject(obj)).toBe(true);
    });

    it("値の中に Uint8Array 以外が含まれている場合は false を返す", () => {
        const obj = { a: new Uint8Array([1]), b: 123 };
        expect(isAssetsObject(obj)).toBe(false);
    });

    it("配列の場合は false を返す", () => {
        expect(isAssetsObject([new Uint8Array([1])])).toBe(false);
    });

    it("null やオブジェクト以外の型の場合は false を返す", () => {
        expect(isAssetsObject(null)).toBe(false);
        expect(isAssetsObject(undefined)).toBe(false);
        expect(isAssetsObject(123)).toBe(false);
        expect(isAssetsObject("str")).toBe(false);
    });

    it("空オブジェクトの場合は true を返す", () => {
        expect(isAssetsObject({})).toBe(true);
    });

    it("Map インスタンスの場合は false を返す", () => {
        const map = new Map([["image", new Uint8Array([1, 2, 3])]]);
        expect(isAssetsObject(map)).toBe(false);

        // msgpack は専用 codec を使わなければ Map をエンコードできないので、
        // 実際にはこのケースは発生しない想定です。
    });
});
