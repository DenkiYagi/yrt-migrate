import { toYrtRoot, isAlreadyMigrated, getXPath } from "./utils.js";
import { DOMParser } from "@xmldom/xmldom";

describe("isAlreadyMigrated", () => {
    it('新YRT（layouts配列あり・旧要素なし）はマイグレーション済みと判定', () => {
        const yrtRoot = ["YRT", 1, { l: [[null, "<StackLayout/>"]], s: null, a: null }];
        expect(isAlreadyMigrated(yrtRoot)).toBe(true);
    });
    it('layouts配列が空なら未マイグレーションと判定', () => {
        const yrtRoot = ["YRT", 1, { l: [], s: null, a: null }];
        expect(isAlreadyMigrated(yrtRoot)).toBe(false);
    });
    it('旧YRT（LayoutXml直下）は未マイグレーションと判定', () => {
        const yrtRoot = ["YRT", 1, { LayoutXml: "<LayoutXml><LinearLayout/></LayoutXml>" }];
        expect(isAlreadyMigrated(yrtRoot)).toBe(false);
    });
    it('新YRTでも旧要素が直下にあれば未マイグレーションと判定', () => {
        const yrtRoot = ["YRT", 1, { l: [[null, "<StackLayout/>"]], LayoutXml: "<LayoutXml/>" }];
        expect(isAlreadyMigrated(yrtRoot)).toBe(false);
    });
    it('不正なデータは未マイグレーションと判定', () => {
        expect(isAlreadyMigrated(null)).toBe(false);
        expect(isAlreadyMigrated({})).toBe(false);
        expect(isAlreadyMigrated([])).toBe(false);
    });
});

describe("getXPath", () => {
    it("単純な要素のXPathが正しく取得できる", () => {
        const xml = `<LinearLayout><Image width='100'/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const image = doc.getElementsByTagName("Image")[0];
        expect(getXPath(image)).toBe("/LinearLayout/Image");
    });

    it("兄弟要素が複数ある場合インデックスが付与される", () => {
        const xml = `<LinearLayout><Image/><Image/><Image/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const images = doc.getElementsByTagName("Image");
        expect(getXPath(images[2])).toBe("/LinearLayout/Image[3]");
    });

    it("入れ子構造でも正しいXPathが取得できる", () => {
        const xml = `<LinearLayout><StackLayout><Image/></StackLayout></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const image = doc.getElementsByTagName("Image")[0];
        expect(getXPath(image)).toBe("/LinearLayout/StackLayout/Image");
    });

    it("兄弟要素が混在する場合でも正しいインデックスが付与される", () => {
        const xml = `<LinearLayout><Image/><Text/><Image/><Image/></LinearLayout>`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const images = doc.getElementsByTagName("Image");
        expect(getXPath(images[2])).toBe("/LinearLayout/Image[3]");
    });
});
