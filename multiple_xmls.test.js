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
import * as multiple_xmls from "./multiple_xmls.mjs";
import { yrtRootToPackage } from "./yrt_format.js";

describe("multiple_xmls", () => {
    it("LayoutXml直下の複数レイアウトを分割してlayouts配列に格納する", () => {
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>
<LayoutXml>
    <LinearLayout direction="vertical">
        <Text>Layout 1</Text>
    </LinearLayout>
    <StackLayout>
        <Text>Layout 2</Text>
    </StackLayout>
</LayoutXml>`;
        // YRTルート形式: ["YRT", 1, { l: [[null, xml]], s: null, a: null }]
        const yrtRoot = [
            "YRT",
            1,
            {
                l: [[null, inputXml]],
                s: null,
                a: null,
            },
        ];
        const result = multiple_xmls.migrate(yrtRoot);
        const pkg = yrtRootToPackage(result);
        expect(pkg.layouts.length).toBe(2);

        expect(pkg.layouts[0].xml.startsWith("<LinearLayout")).toBe(true);
        expect(pkg.layouts[0].xml).toContain("Layout 1");
        expect(pkg.layouts[0].xml).not.toContain("Layout 2");
        expect(pkg.layouts[0].xml.endsWith("</LinearLayout>")).toBe(true);

        expect(pkg.layouts[1].xml.startsWith("<StackLayout")).toBe(true);
        expect(pkg.layouts[1].xml).toContain("Layout 2");
        expect(pkg.layouts[1].xml).not.toContain("Layout 1");
        expect(pkg.layouts[1].xml.endsWith("</StackLayout>")).toBe(true);
    });
});
