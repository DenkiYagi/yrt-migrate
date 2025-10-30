import { validateLegacyLayoutXml } from "../../../src/yrt_format_validator.mjs";

describe("validateLegacyLayoutXml", () => {
    describe("基本的な動作", () => {
        it("ルート要素が <LayoutXml> の場合は success を返す", () => {
            const xml = `<LayoutXml><LinearLayout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
            expect(result.value).toBe(xml);
        });

        it("ルート要素が <LayoutXml> でない場合は error を返す", () => {
            const xml = `<OtherRoot></OtherRoot>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("LayoutXml");
        });

        it("不正なXMLの場合は error を返す", () => {
            const xml = `Invalid text`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("パース");
        });

        it("空文字列の場合は error を返す", () => {
            const result = validateLegacyLayoutXml("");
            expect(result.type).toBe("error");
        });
    });

    describe("XMLの前処理要素を含む場合", () => {
        it("ルート直前にコメントがあっても <LayoutXml> なら success を返す", () => {
            const xml = `<!-- comment --><LayoutXml><LinearLayout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
        });

        it("ルート直前にXML宣言があってもルートが <LayoutXml> なら success を返す", () => {
            const xml = `<?xml version='1.0'?><LayoutXml><LinearLayout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
        });
    });

    describe("LayoutXmlの位置が不正な場合", () => {
        it("<LayoutXml> が子要素の場合は error を返す", () => {
            const xml = `<Root><LayoutXml></LayoutXml></Root>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
        });

        it("<LayoutXml> が兄弟要素の場合は error を返す", () => {
            const xml = `<Root></Root><LayoutXml></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
        });
    });

    describe("XMLパーサーの警告処理", () => {
        it("属性の引用符が不正な場合は warning を返す", () => {
            const xml = `<LayoutXml id=unquoted>content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("warning");
            expect(result.value).toBe(xml);
            expect(result.message).toContain("警告");
            expect(result.message).toContain("missed quot");
        });

        it("未閉鎖のタグがある場合は warning を返す", () => {
            const xml = `<LayoutXml><LinearLayout></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("warning");
            expect(result.value).toBe(xml);
            expect(result.message).toContain("警告");
            expect(result.message).toContain("unclosed xml");
        });

        it("複数の警告がある場合はすべてメッセージに含める", () => {
            const xml = `<LayoutXml attr=unquoted><LinearLayout></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("warning");
            expect(result.value).toBe(xml);
            expect(result.message).toContain("missed quot");
            expect(result.message).toContain("unclosed xml");
            expect((result.message.match(/;/g) ?? []).length).toBeGreaterThan(0);
        });
    });

    describe("XMLパーサーのエラー処理", () => {
        it("不正なタグ名の場合は error を返す", () => {
            const xml = `<LayoutXml><Linear&Layout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
            expect(result.message).toContain("invalid tagName");
        });

        it("不正なエンティティの場合は error を返す", () => {
            const xml = `<LayoutXml attr="&invalidEntity;">content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
            expect(result.message).toContain("entity not found");
        });

        it("重複した属性の場合は error を返す", () => {
            const xml = `<LayoutXml id="1" id="2">content</LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
            expect(result.message).toContain("redefined");
        });

        it("不正なXML構造の場合は error を返す", () => {
            const xml = `<LayoutXml><<LinearLayout/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
        });

        it("終了タグが不足している場合は error を返す", () => {
            const xml = `<LayoutXml><LinearLayout/>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
        });
    });

    describe("エッジケースの処理", () => {
        it("パースはできるが documentElement がない場合は error を返す", () => {
            const xml = `This is not XML`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースに失敗");
        });

        it("コメントのみの場合は error を返す", () => {
            const xml = `<!-- This is a comment -->`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースに失敗");
        });

        it("空白のみの場合は error を返す", () => {
            const xml = `   `;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースに失敗");
        });

        it("正常なXMLでもルートが LayoutXml でなければ error を返す", () => {
            const xml = `<OtherRoot>content</OtherRoot>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("LayoutXml ではありません");
        });

        it("例外がスローされた場合は error を返す", () => {
            const xml = ``;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("error");
            expect(result.message).toContain("XMLパースエラー");
        });
    });

    describe("正常なケースの確認", () => {
        it("CDATAセクションがあっても正常に処理する", () => {
            const xml = `<LayoutXml><![CDATA[some content]]></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
            expect(result.value).toBe(xml);
        });

        it("DTDがあっても正常に処理する", () => {
            const xml = `<!DOCTYPE LayoutXml><LayoutXml></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
            expect(result.value).toBe(xml);
        });

        it("処理命令があっても正常に処理する", () => {
            const xml = `<?xml version="1.0"?><?custom instruction?><LayoutXml></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
            expect(result.value).toBe(xml);
        });

        it("名前空間があっても正常に処理する", () => {
            const xml = `<LayoutXml xmlns:ns="http://example.com"><ns:child/></LayoutXml>`;
            const result = validateLegacyLayoutXml(xml);
            expect(result.type).toBe("success");
            expect(result.value).toBe(xml);
        });
    });
});
