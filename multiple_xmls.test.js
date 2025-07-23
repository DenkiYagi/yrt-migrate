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
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import * as multiple_xmls from "./multiple_xmls.mjs";
import { strict as assert } from "assert";

describe("multiple_xmls", () => {
    describe("XMLファイルの場合", () => {
        it("LayoutXml要素を削除して子要素を親に移動する", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <LinearLayout direction="vertical">
        <Text>Hello</Text>
    </LinearLayout>
    <StackLayout>
        <Text>World</Text>
    </StackLayout>
</LayoutXml>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const result = multiple_xmls.migrate(doc);

            assert.strictEqual(result, null); // XMLファイルの場合はnullを返す

            const outputXml = new XMLSerializer().serializeToString(doc);

            // LayoutXml要素が削除されていることを確認
            assert.ok(!outputXml.includes("<LayoutXml>"));
            assert.ok(!outputXml.includes("</LayoutXml>"));

            // 子要素が残っていることを確認
            assert.ok(outputXml.includes("<LinearLayout"));
            assert.ok(outputXml.includes("<StackLayout"));
            assert.ok(outputXml.includes("<Text>Hello</Text>"));
            assert.ok(outputXml.includes("<Text>World</Text>"));
        });

        it("LayoutXml要素がない場合は何も変更しない", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LinearLayout>
    <Text>Test</Text>
</LinearLayout>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const originalXml = new XMLSerializer().serializeToString(doc);

            const result = multiple_xmls.migrate(doc);

            assert.strictEqual(result, null);

            const outputXml = new XMLSerializer().serializeToString(doc);
            assert.strictEqual(outputXml, originalXml);
        });
    });

    describe("YRTファイルの場合", () => {
        it("複数のレイアウトを分割してlayouts配列に格納する", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <LinearLayout direction="vertical">
        <Text>Layout 1</Text>
    </LinearLayout>
    <StackLayout>
        <Text>Layout 2</Text>
    </StackLayout>
    <Style>
        <Grid key="grid1">
            <CellRange borderColor="black"/>
        </Grid>
    </Style>
</LayoutXml>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const yrtData = [inputXml]; // 元のYRTデータ

            const result = multiple_xmls.migrate(doc, yrtData);

            assert.ok(Array.isArray(result));
            assert.ok(result.length >= 2); // 最低でも2つのレイアウト

            // 最初のレイアウトにLinearLayoutが含まれていることを確認
            assert.ok(result[0].includes("<LinearLayout"));
            assert.ok(result[0].includes("Layout 1"));

            // 2番目のレイアウトにStackLayoutが含まれていることを確認
            assert.ok(result[1].includes("<StackLayout"));
            assert.ok(result[1].includes("Layout 2"));

            // スタイルが追加されていることを確認
            const hasStyle = result.some((item) => item.includes("<Style"));
            assert.ok(hasStyle);
        });

        it("LayoutXml要素がない場合は元のデータをそのまま返す", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LinearLayout>
    <Text>Test</Text>
</LinearLayout>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const yrtData = [inputXml];

            const result = multiple_xmls.migrate(doc, yrtData);

            assert.deepStrictEqual(result, yrtData);
        });
    });
});
