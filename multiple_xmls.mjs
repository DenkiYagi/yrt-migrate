/**
 * Copyright 2023 DenkiYagi Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import xpath from 'xpath';
import { XMLSerializer } from '@xmldom/xmldom';
import { yrtRootToPackage, packageToYrtRoot } from './yrt_format.js';

/**
 * `<LayoutXml>` 要素を削除し、1XML1レイアウト化するマイグレーション
 * 
 * 処理内容:
 * 1. `<LayoutXml>` 直下の `<LinearLayout>` または `<StackLayout>` をそれぞれ分割し、
 *    YRT の `layouts` 配列に順序通り格納する
 * 2. スタイル用の XML がなければ YRT の `style` に格納する（`<Style>` 要素をルートとするXML）
 * 
 * 注意事項:
 * - YRT ファイルはファイル名やIDで管理せず、`layouts`配列の順序でレイアウトを管理する
 * 
 * @param {Document} doc XMLドキュメント
 * @param {Object} yrtData YRTファイルのデータ（YRTファイルの場合のみ）
 * @returns {Object|null} 変更されたYRTデータ、またはXMLファイルの場合はnull
 */
export function migrate(doc, yrtData = null) {
    const layoutXmlElements = xpath.select("//LayoutXml", doc);
    
    if (!layoutXmlElements || layoutXmlElements.length === 0) {
        return yrtData;
    }

    // YRTファイルの場合のみ、複数レイアウト分割処理を実行
    if (yrtData) {
        return migrateYrtFile(doc, yrtData, layoutXmlElements);
    } else {
        // XMLファイルの場合は単純に LayoutXml 要素を削除
        return migrateXmlFile(doc, layoutXmlElements);
    }
}

/**
 * YRTファイルの場合の1XML1レイアウト化処理
 * @param {Document} doc 
 * @param {Object} yrtData 
 * @param {Node[]} layoutXmlElements 
 * @returns {Object}
 */
function migrateYrtFile(doc, yrtRoot, layoutXmlElements) {
    // YrtRoot -> YrtPackage へ変換
    const pkg = yrtRootToPackage(yrtRoot);
    const newLayouts = [];
    let styleXml = null;

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

        // Style要素があるかチェック
        const styleElements = xpath.select("Style", layoutXmlElement);
        if (styleElements.length > 0 && !styleXml) {
            const newDoc = doc.implementation.createDocument(null, null, null);
            const clonedStyle = styleElements[0].cloneNode(true);
            newDoc.appendChild(clonedStyle);
            const serializer = new XMLSerializer();
            styleXml = serializer.serializeToString(newDoc);
        }
    });

    // layouts配列を上書き
    if (newLayouts.length > 0) {
        pkg.layouts = newLayouts;
    }
    // styleがあれば上書き
    if (styleXml) {
        pkg.style = styleXml;
    }

    // YrtPackage -> YrtRoot へ戻して返す
    return packageToYrtRoot(pkg);
}

/**
 * XMLファイルの場合のLayoutXml削除処理
 * @param {Document} doc 
 * @param {Node[]} layoutXmlElements 
 * @returns {null}
 */
function migrateXmlFile(doc, layoutXmlElements) {
    layoutXmlElements.forEach(layoutXmlElement => {
        const parent = layoutXmlElement.parentNode;
        if (parent) {
            // LayoutXml の子要素をすべて親に移動
            while (layoutXmlElement.firstChild) {
                parent.insertBefore(layoutXmlElement.firstChild, layoutXmlElement);
            }
            // LayoutXml 要素自体を削除
            parent.removeChild(layoutXmlElement);
        }
    });

    return null;
}
