/**
 * Copyright 2024 DenkiYagi Inc.
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
import * as deprecated_border_style from './deprecated_border_style.mjs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

test.each([
    {input: '<LinearLayout borderStyle="dashed"/>', expected: '<LinearLayout borderStyle="dash"/>'},
    {input: '<LinearLayout borderStyle="Dashed"/>', expected: '<LinearLayout borderStyle="dash"/>'},

    {input: '<LinearLayout borderStyle="dotted"/>', expected: '<LinearLayout borderStyle="dot"/>'},
    {input: '<LinearLayout borderStyle="Dotted"/>', expected: '<LinearLayout borderStyle="dot"/>'},

    {input: '<LinearLayout borderStyle="solid"/>',  expected: '<LinearLayout borderStyle="solid"/>'},
    {input: '<LinearLayout borderStyle="SOLID"/>',  expected: '<LinearLayout borderStyle="SOLID"/>'},

    {input: '<LinearLayout borderStyle="solid dashed"/>', expected: '<LinearLayout borderStyle="solid dash"/>'},
    {input: '<LinearLayout borderStyle="SOLID dashed"/>', expected: '<LinearLayout borderStyle="SOLID dash"/>'},

    {input: '<LinearLayout borderStyle="dashed dotted dotted dashed"/>', expected: '<LinearLayout borderStyle="dash dot dot dash"/>'},

    {input: '<LayoutBody><Grid borderStyle="dashed"/><Grid borderStyle="dotted"/></LayoutBody>',
        expected: '<LayoutBody><Grid borderStyle="dash"/><Grid borderStyle="dot"/></LayoutBody>'},
])('属性値を更新できる: "$input"', ({input, expected}) => {
    const doc = new DOMParser().parseFromString(input);
    deprecated_border_style.migrate(doc);
    const actual = new XMLSerializer().serializeToString(doc);
    expect(actual).toStrictEqual(expected);
});
