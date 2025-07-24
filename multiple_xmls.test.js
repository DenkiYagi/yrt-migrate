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

describe("multiple_xmls", () => {
    describe("XMLファイルの場合", () => {
        it("LayoutXml要素を削除して子要素を親に移動する", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <LinearLayout direction="vertical">
        <LayoutBody>
            <Text>Hello</Text>
        </LayoutBody>
    </LinearLayout>
    <StackLayout>
        <Text>World</Text>
    </StackLayout>
</LayoutXml>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const result = multiple_xmls.migrate(doc);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0]).toContain("<LinearLayout");
            expect(result[0]).toContain("<LayoutBody>");
            expect(result[0]).toContain("<Text>Hello</Text>");
            expect(result[1]).toContain("<StackLayout");
            expect(result[1]).toContain("<Text>World</Text>");
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
            const yrtData = [
                "YRT",
                1,
                {
                    l: [],
                    s: null,
                    a: null,
                },
            ];

            const result = multiple_xmls.migrate(doc, yrtData);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThanOrEqual(2);
            const layouts = result[2].l;
            expect(layouts[0][1]).toContain("<LinearLayout");
            expect(layouts[0][1]).toContain("Layout 1");
            expect(layouts[1][1]).toContain("<StackLayout");
            expect(layouts[1][1]).toContain("Layout 2");
            expect(result[2].s).toContain("<Style");
        });

        it("LayoutXml要素がない場合は元のデータをそのまま返す", () => {
            const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LinearLayout>
    <Text>Test</Text>
</LinearLayout>`;

            const doc = new DOMParser().parseFromString(inputXml, "text/xml");
            const yrtData = [inputXml];

            const result = multiple_xmls.migrate(doc, yrtData);

            expect(result).toEqual(yrtData);
        });
    });
});
