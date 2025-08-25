import { validateAssetsObject, validateAlreadyMigrated } from "./yrt_format_legacy.mjs";
import { validateLegacyYrtFormat, validateLegacyLayoutXml } from "./yrt_format_legacy.mjs";

describe("validateLegacyLayoutXml", () => {
    it("ルート要素が <LayoutXml> の場合は success を返す", () => {
        const xml = `<LayoutXml><LinearLayout/></LayoutXml>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('success');
        expect(result.value).toBe(xml);
    });
    it("ルート要素が <LayoutXml> でない場合は error を返す", () => {
        const xml = `<OtherRoot></OtherRoot>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('error');
        expect(result.message).toContain('LayoutXml');
    });
    it("不正なXMLの場合は error を返す", () => {
        const xml = `Invalid text`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('error');
        expect(result.message).toContain('パース');
    });
    it("空文字列の場合は error を返す", () => {
        const result = validateLegacyLayoutXml("");
        expect(result.type).toBe('error');
    });

    it("ルート直前にコメントがあっても <LayoutXml> なら success を返す", () => {
        const xml = `<!-- comment --><LayoutXml><LinearLayout/></LayoutXml>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('success');
    });

    it("ルート直前にXML宣言があってもルートが <LayoutXml> なら success を返す", () => {
        const xml = `<?xml version='1.0'?><LayoutXml><LinearLayout/></LayoutXml>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('success');
    });

    it("<LayoutXml> が子要素の場合は error を返す", () => {
        const xml = `<Root><LayoutXml></LayoutXml></Root>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('error');
    });

    it("<LayoutXml> が兄弟要素の場合は error を返す", () => {
        const xml = `<Root></Root><LayoutXml></LayoutXml>`;
        const result = validateLegacyLayoutXml(xml);
        expect(result.type).toBe('error');
    });
});

describe("validateLegacyYrtFormat", () => {
    it("[xml] でルートが <LayoutXml> の場合は success を返す", () => {
        const arr = ["<LayoutXml><LinearLayout/></LayoutXml>"];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('success');
        expect(result.value).toEqual(arr);
    });
    it("[xml, assets] でルートが <LayoutXml> の場合は success を返す", () => {
        const arr = ["<LayoutXml><LinearLayout/></LayoutXml>", { foo: new Uint8Array([1, 2, 3]) }];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('success');
        expect(result.value).toEqual(arr);
    });
    it("[xml] でルートが <LayoutXml> でない場合は error を返す", () => {
        const arr = ["<OtherRoot></OtherRoot>"];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('error');
        expect(result.message).toContain('レイアウトXML');
    });
    it("[xml, assets] でルートが <LayoutXml> でない場合は error を返す", () => {
        const arr = ["<OtherRoot></OtherRoot>", { foo: new Uint8Array([1, 2, 3]) }];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('error');
        expect(result.message).toContain('レイアウトXML');
    });
    it("[xml, null] の場合は error を返す", () => {
        const arr = ["<LayoutXml></LayoutXml>", null];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('error');
        expect(result.message).toContain('オブジェクト');
    });
    it("[xml, オブジェクト以外] の場合は error を返す", () => {
        const arr = ["<LayoutXml></LayoutXml>", 123];
        const result = validateLegacyYrtFormat(arr);
        expect(result.type).toBe('error');
        expect(result.message).toContain('オブジェクト');
    });
    it("配列でない入力の場合は error を返す", () => {
        expect(validateLegacyYrtFormat(null).type).toBe('error');
        expect(validateLegacyYrtFormat({}).type).toBe('error');
        expect(validateLegacyYrtFormat("<LayoutXml></LayoutXml>").type).toBe('error');
    });
    it("配列長が不正な場合は error を返す", () => {
        expect(validateLegacyYrtFormat([]).type).toBe('error');
        expect(validateLegacyYrtFormat(["a", "b", "c"]).type).toBe('error');
    });
    it("[文字列以外] の場合は error を返す", () => {
        const result = validateLegacyYrtFormat([123]);
        expect(result.type).toBe('error');
        expect(result.message).toContain('文字列');
    });
});

describe("validateAssetsObject", () => {
    it("すべての値が Uint8Array のオブジェクトの場合は success を返す", () => {
        const obj = { a: new Uint8Array([1]), b: new Uint8Array([2, 3]) };
        const result = validateAssetsObject(obj);
        expect(result.type).toBe('success');
        expect(result.value).toEqual(obj);
    });

    it("値の中に Uint8Array 以外が含まれている場合は error を返す", () => {
        const obj = { a: new Uint8Array([1]), b: 123 };
        const result = validateAssetsObject(obj);
        expect(result.type).toBe('error');
        expect(result.message).toContain('Uint8Array');
    });

    it("配列の場合は error を返す", () => {
        const result = validateAssetsObject([new Uint8Array([1])]);
        expect(result.type).toBe('error');
        expect(result.message).toContain('オブジェクト');
    });

    it("null やオブジェクト以外の型の場合は error を返す", () => {
        expect(validateAssetsObject(null).type).toBe('error');
        expect(validateAssetsObject(undefined).type).toBe('error');
        expect(validateAssetsObject(123).type).toBe('error');
        expect(validateAssetsObject("str").type).toBe('error');
    });

    it("空オブジェクトの場合は success を返す", () => {
        const result = validateAssetsObject({});
        expect(result.type).toBe('success');
    });

    it("Map インスタンスの場合は error を返す", () => {
        const map = new Map([["image", new Uint8Array([1, 2, 3])]]);
        const result = validateAssetsObject(map);
        expect(result.type).toBe('error');
        expect(result.message).toContain('アセットオブジェクトが有効なオブジェクトではありません。');

        // msgpack は専用 codec を使わなければ Map をエンコードできないので、
        // 実際にはこのケースは発生しない想定です。
    });
});

describe("validateAlreadyMigrated", () => {
    it('新YRT（layouts配列あり）はマイグレーション済みと判定', () => {
        const arr = ["YRT", 1, { l: [[null, "<StackLayout/>"]], s: null, a: null }];
        const result = validateAlreadyMigrated(arr);
        expect(result.type).toBe('success');
        expect(result.value).toEqual(arr);
    });

    it('layout配列が空なら未マイグレーションと判定', () => {
        const arr = ["YRT", 1, { l: [], s: null, a: null }];
        const result = validateAlreadyMigrated(arr);
        expect(result.type).toBe('error');
        expect(result.message).toContain('空です');
    });

    it('YRTヘッダーが不正なら未マイグレーションと判定', () => {
        const arr1 = ["WRONG", 1, { l: [[null, "<StackLayout/>"]] }];
        const arr2 = ["YRT", 2, { l: [[null, "<StackLayout/>"]] }];
        expect(validateAlreadyMigrated(arr1).type).toBe('error');
        expect(validateAlreadyMigrated(arr2).type).toBe('error');
    });

    it('不正なデータ構造は未マイグレーションと判定', () => {
        expect(validateAlreadyMigrated(null).type).toBe('error');
        expect(validateAlreadyMigrated({}).type).toBe('error');
        expect(validateAlreadyMigrated([]).type).toBe('error');
        expect(validateAlreadyMigrated(["YRT", 1]).type).toBe('error');
        expect(validateAlreadyMigrated(["YRT", 1, null]).type).toBe('error');
        expect(validateAlreadyMigrated(["YRT", 1, "string"]).type).toBe('error');
    });

    it('複数のlayoutsがある場合もマイグレーション済みと判定', () => {
        const arr = ["YRT", 1, {
            l: [
                [null, "<StackLayout/>"],
                ["layout2", "<StackLayout/>"]
            ],
            s: "<Style/>",
            a: { image: new Uint8Array([1, 2, 3]) }
        }];
        const result = validateAlreadyMigrated(arr);
        expect(result.type).toBe('success');
        expect(result.value).toEqual(arr);
    });
});
