import * as direction_attribute from './direction_attribute.mjs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'

test.each([
    {input: "", expected: []},
    {input: "30", expected: ["30"]},
    {input: "30 30 _ _", expected: ["30", "30", "_", "_"]},
    {input: "dashed dashed dotted dashed", expected: ["dashed", "dashed", "dotted", "dashed"]},
    {input: "Cmyk(1, 0, 0, 0)", expected: ["Cmyk(1, 0, 0, 0)"]},
    {input: "cmyk(1, 0, 0, 0) cmyk(0, 1, 0, 0) cmyk(0, 0, 1, 0) cmyk(0, 0, 0, 1)", expected: ["cmyk(1, 0, 0, 0)", "cmyk(0, 1, 0, 0)", "cmyk(0, 0, 1, 0)", "cmyk(0, 0, 0, 1)"]},
    //{input: "${hide}", expected: ["${hide}"]},
])('属性値を分解できる: "$input"', ({input, expected}) => {
    expect(direction_attribute.splitAttributeValue(input)).toStrictEqual(expected);
});

test.each([
    {value: "_", expected: '<Grid/>'},
    {value: "1", expected: '<Grid test="1"/>'},

    {value: "_ _", expected: '<Grid/>'},
    {value: "1 _", expected: '<Grid testTop="1" testBottom="1"/>'},
    {value: "_ 2", expected: '<Grid testRight="2" testLeft="2"/>'},
    {value: "1 2", expected: '<Grid test="1 2"/>'},

    {value: "_ _ _", expected: '<Grid/>'},
    {value: "1 _ _", expected: '<Grid testTop="1"/>'},
    {value: "_ 2 _", expected: '<Grid testRight="2" testLeft="2"/>'},
    {value: "_ _ 3", expected: '<Grid testBottom="3"/>'},
    {value: "1 _ 3", expected: '<Grid testTop="1" testBottom="3"/>'},
    {value: "1 2 3", expected: '<Grid test="1 2 3"/>'},

    {value: "_ _ _ _", expected: '<Grid/>'},
    {value: "1 _ _ _", expected: '<Grid testTop="1"/>'},
    {value: "_ 2 _ _", expected: '<Grid testRight="2"/>'},
    {value: "_ _ 3 _", expected: '<Grid testBottom="3"/>'},
    {value: "_ _ _ 4", expected: '<Grid testLeft="4"/>'},
    {value: "1 _ _ 4", expected: '<Grid testTop="1" testLeft="4"/>'},
    {value: "_ 2 3 _", expected: '<Grid testRight="2" testBottom="3"/>'},
    {value: "1 2 3 4", expected: '<Grid test="1 2 3 4"/>'},

    {value: "_ cmyk(1, 0, 0, 0) cmyk(0, 1, 0, 0) _", expected: '<Grid testRight="cmyk(1, 0, 0, 0)" testBottom="cmyk(0, 1, 0, 0)"/>'},
    {value: "dashed _ dotted", expected: '<Grid testTop="dashed" testBottom="dotted"/>'}
])('属性値を方向別の属性に分割できる: "$value"', ({value, expected}) => {
    const xml = `<Grid test="${value}"/>`;
    const doc = new DOMParser().parseFromString(xml);
    direction_attribute.convertAttribute(doc, "//Grid", "test", "testTop", "testRight", "testBottom", "testLeft");
    const actual = new XMLSerializer().serializeToString(doc);
    expect(actual).toStrictEqual(expected);
});
