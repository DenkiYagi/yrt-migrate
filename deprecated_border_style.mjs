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
import xpath from 'xpath'

function update(attribute) {
    if (!attribute) return;
    if (!xpath.isAttribute(attribute)) return;

    const value = attribute.textContent;

    attribute.textContent = value.replace(/dotted/gi, "dot").replace(/dashed/gi, "dash")
}

/**
 * `dotted`, `dashed` を `dot`, `dash` に変換します。
 * @param {Document} doc 
 * @param {string} expression
 */
function updateAttributeValue(doc, expression) {
    const result = xpath.select(expression, doc);
    if (xpath.isArrayOfNodes(result)) {
        for (let i = 0; i < result.length; i++) {
            update(result[i]);
        }
    } else {
        update(result);
    }
}

/**
 * v1.0.0-alpha.11での `borderStyle` の `dotted`, `dashed` 廃止に伴い、 `dot`, `dash` に置き換えます。
 * @param {Document} doc 
 */
export function migrate(doc) {
    updateAttributeValue(doc, "//@borderStyle");
    updateAttributeValue(doc, "//@borderTopStyle");
    updateAttributeValue(doc, "//@borderRightStyle");
    updateAttributeValue(doc, "//@borderBottomStyle");
    updateAttributeValue(doc, "//@borderLeftStyle");

    updateAttributeValue(doc, "//@outerBorderStyle");
    updateAttributeValue(doc, "//@outerBorderTopStyle");
    updateAttributeValue(doc, "//@outerBorderRightStyle");
    updateAttributeValue(doc, "//@outerBorderBottomStyle");
    updateAttributeValue(doc, "//@outerBorderLeftStyle");
}