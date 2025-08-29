import xpath from 'xpath';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { yrtRootToPackage, packageToYrtRoot } from '../yrt_format.js';

/**
 * `<LayoutXml>` 要素を削除し、1XML1レイアウト化するマイグレーション
 *
 * 処理内容:
 * - `<LayoutXml>` 直下の `<LinearLayout>` または `<StackLayout>` をそれぞれ分割し、
 *    YRT の `layouts` 配列に順序通り格納する
 *
 * 注意事項:
 * - YRT ファイルはファイル名やIDで管理せず、`layouts`配列の順序でレイアウトを管理する
 *
 * @param {Object} yrtRoot v1.0 形式のYRT構造。
 *   ただし alpha.13 からpack構造だけを変換した直後のものであり、
 *   レイアウト配列の中には、alpha.13 の `<LayoutXml>` 要素を使ったXMLが一つだけ存在する想定
 * @returns {Object} 変更されたYRTデータ
 */
export function migrate(yrtRoot) {
    const layouts = yrtRoot[2].l;
    if (layouts.length !== 1) {
        throw new Error([
            "At this point prior to migration, YRT root must contain exactly one XML",
            "since yrtRoot has just been converted from the old format with only the object structure changed.",
        ].join(" "));
    }
    const [_, xml] = layouts[0];
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const layoutXmlElements = xpath.select("//LayoutXml", doc);

    const pkg = yrtRootToPackage(yrtRoot);
    const newLayouts = [];

    layoutXmlElements.forEach(layoutXmlElement => {
        // LayoutXml直下の LinearLayout または StackLayout を取得
        const layoutChildren = xpath.select("LinearLayout | StackLayout", layoutXmlElement);
        layoutChildren.forEach(layoutChild => {
            // 各レイアウトを個別のXMLとして作成
            const newDoc = doc.implementation.createDocument(null, null, null);
            const clonedLayout = layoutChild.cloneNode(true);
            newDoc.appendChild(clonedLayout);
            const serializer = new XMLSerializer();
            const layoutXml = serializer.serializeToString(newDoc);
            newLayouts.push({ name: null, xml: layoutXml });
        });
    });

    // layouts配列を上書き
    if (newLayouts.length > 0) {
        pkg.layouts = newLayouts;
    } else {
        // LayoutBody 必須化については後続ステップで対応
        pkg.layouts = [{ name: null, xml: "<LinearLayout></LinearLayout>" }];
    }

    // YrtPackage -> YrtRoot へ戻して返す
    return packageToYrtRoot(pkg);
}
