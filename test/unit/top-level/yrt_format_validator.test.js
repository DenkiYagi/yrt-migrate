import { validateAssetsObject, validateAlreadyMigrated } from "../../../src/yrt_format_validator.mjs";
import { validateLegacyYrtFormat, validateLegacyLayoutXml } from "../../../src/yrt_format_validator.mjs";

describe("validateLegacyLayoutXml", () => {
    describe("基本的な動作", () => {
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
    });

    describe("XMLの前処理要素を含む場合", () => {
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
    });

    describe("LayoutXmlの位置が不正な場合", () => {
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

    describe("XMLパーサーの警告処理", () => {
        it("属性の引用符が不正な場合は warning を返す", () => {
            const xml = `<LayoutXml id=unquoted>content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('warning');
            expect(result.value).toBe(xml);
            expect(result.message).toContain('警告');
            expect(result.message).toContain('missed quot'); // Specific warning content
        });

        it("未閉鎖のタグがある場合は warning を返す", () => {
            const xml = `<LayoutXml><LinearLayout></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('warning');
            expect(result.value).toBe(xml);
            expect(result.message).toContain('警告');
            expect(result.message).toContain('unclosed xml'); // Specific warning content
        });

        it("複数の警告がある場合はすべてメッセージに含める", () => {
            const xml = `<LayoutXml attr=unquoted><LinearLayout></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('warning');
            expect(result.value).toBe(xml);
            expect(result.message).toContain('警告');
            expect(result.message).toContain('missed quot');  // First warning type
            expect(result.message).toContain('unclosed xml'); // Second warning type
            expect((result.message.match(/;/g) || []).length).toBeGreaterThan(0); // Multiple warnings separated by semicolons
        });
    });

    describe("XMLパーサーのエラー処理", () => {
        it("不正なタグ名の場合は error を返す", () => {
            const xml = `<LayoutXml><Linear&Layout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
            expect(result.message).toContain('invalid tagName'); // Specific error content
        });

        it("不正なエンティティの場合は error を返す", () => {
            const xml = `<LayoutXml attr="&invalidEntity;">content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
            expect(result.message).toContain('entity not found'); // Specific error content
        });

        it("重複した属性の場合は error を返す (fatalError)", () => {
            const xml = `<LayoutXml id="1" id="2">content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
            expect(result.message).toContain('redefined'); // Specific error content
        });

        it("不正なXML構造の場合は error を返す", () => {
            const xml = `<LayoutXml><<LinearLayout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
        });

        it("終了タグが不足している場合は error を返す", () => {
            const xml = `<LayoutXml><LinearLayout/>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
        });
    });

    describe("エッジケースの処理", () => {
        it("パースはできるが documentElement がない場合は error を返す", () => {
            const xml = `This is not XML`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースに失敗');
        });

        it("コメントのみの場合は error を返す", () => {
            const xml = `<!-- This is a comment -->`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースに失敗');
        });

        it("空白のみの場合は error を返す", () => {
            const xml = `   `;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースに失敗');
        });

        it("正常なXMLでもルートが LayoutXml でなければ error を返す", () => {
            const xml = `<OtherRoot>content</OtherRoot>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('LayoutXml ではありません');
        });

        it("例外がスローされた場合は error を返す", () => {
            // Note: This is harder to trigger with current xmldom version,
            // but keeping for completeness
            const xml = ``;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('error');
            expect(result.message).toContain('XMLパースエラー');
        });
    });

    describe("正常なケースの確認", () => {
        it("CDATAセクションがあっても正常に処理する", () => {
            const xml = `<LayoutXml><![CDATA[some content]]></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('success');
            expect(result.value).toBe(xml);
        });

        it("DTDがあっても正常に処理する", () => {
            const xml = `<!DOCTYPE LayoutXml><LayoutXml></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('success');
            expect(result.value).toBe(xml);
        });

        it("処理命令があっても正常に処理する", () => {
            const xml = `<?xml version="1.0"?><?custom instruction?><LayoutXml></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('success');
            expect(result.value).toBe(xml);
        });

        it("名前空間があっても正常に処理する", () => {
            const xml = `<LayoutXml xmlns:ns="http://example.com"><ns:child/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe('success');
            expect(result.value).toBe(xml);
        });
    });
});

describe("validateLegacyYrtFormat", () => {
    describe("基本的な動作", () => {
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
        it("[xml, 空のassets] でルートが <LayoutXml> の場合は success を返す", () => {
            const arr = ["<LayoutXml><LinearLayout/></LayoutXml>", {}];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('success');
            expect(result.value).toEqual(arr);
        });
    });

    describe("XMLの検証エラー", () => {
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
        it("[不正なXML] の場合は error を返す", () => {
            const arr = ["Invalid XML"];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('レイアウトXML');
        });
        it("[不正なXML, assets] の場合は error を返す", () => {
            const arr = ["Invalid XML", { foo: new Uint8Array([1, 2, 3]) }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('レイアウトXML');
        });
    });

    describe("XMLの検証警告", () => {
        it("[警告のあるXML] の場合は warning を返す", () => {
            const xml = `<LayoutXml id=unquoted>content</LayoutXml>`;
            const arr = [xml];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('warning');
            expect(result.value).toEqual(arr);
            expect(result.message).toContain('missed quot');
        });
        it("[警告のあるXML, assets] の場合は warning を返す", () => {
            const xml = `<LayoutXml id=unquoted>content</LayoutXml>`;
            const arr = [xml, { foo: new Uint8Array([1, 2, 3]) }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('warning');
            expect(result.value).toEqual(arr);
            expect(result.message).toContain('missed quot');
        });
    });

    describe("アセットの型検証", () => {
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
        it("[xml, 文字列] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", "string"];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('オブジェクト');
        });
        it("[xml, 配列] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", [new Uint8Array([1, 2, 3])]];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('オブジェクト');
        });
    });

    describe("アセットの内容検証", () => {
        it("[xml, Uint8Array以外の値を含むassets] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", { valid: new Uint8Array([1, 2, 3]), invalid: 123 }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('Uint8Array');
        });
        it("[xml, 文字列値を含むassets] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", { image: "not-uint8array" }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('Uint8Array');
        });
        it("[xml, null値を含むassets] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", { image: null }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('Uint8Array');
        });
        it("[xml, 配列値を含むassets] の場合は error を返す", () => {
            const arr = ["<LayoutXml></LayoutXml>", { image: [1, 2, 3] }];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('Uint8Array');
        });
        it("[xml, Mapインスタンス] の場合は error を返す", () => {
            const map = new Map([["image", new Uint8Array([1, 2, 3])]]);
            const arr = ["<LayoutXml></LayoutXml>", map];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('有効なオブジェクト');
        });
        it("[xml, Setインスタンス] の場合は error を返す", () => {
            const set = new Set([new Uint8Array([1, 2, 3])]);
            const arr = ["<LayoutXml></LayoutXml>", set];
            const result = validateLegacyYrtFormat(arr);
            expect(result.type).toBe('error');
            expect(result.message).toContain('アセット');
            expect(result.message).toContain('有効なオブジェクト');
        });
    });

    describe("配列構造の検証", () => {
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
        it("[文字列以外, assets] の場合は error を返す", () => {
            const result = validateLegacyYrtFormat([123, { foo: new Uint8Array([1, 2, 3]) }]);
            expect(result.type).toBe('error');
            expect(result.message).toContain('文字列');
        });
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
