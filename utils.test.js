import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

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
