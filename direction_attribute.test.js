import * as direction_attribute from './direction_attribute.mjs';

test.each([
    {input: "", expected: []},
    {input: "30", expected: ["30"]},
    {input: "30 30 _ _", expected: ["30", "30", "_", "_"]},
    {input: "dashed dashed dotted dashed", expected: ["dashed", "dashed", "dotted", "dashed"]},
    {input: "Cmyk(1, 0, 0, 0)", expected: ["Cmyk(1, 0, 0, 0)"]},
    {input: "cmyk(1, 0, 0, 0) cmyk(0, 1, 0, 0) cmyk(0, 0, 1, 0) cmyk(0, 0, 0, 1)", expected: ["cmyk(1, 0, 0, 0)", "cmyk(0, 1, 0, 0)", "cmyk(0, 0, 1, 0)", "cmyk(0, 0, 0, 1)"]},
    //{input: "${hide}", expected: ["${hide}"]},
])('属性値を分解できる: $input', ({input, expected}) => {
    expect(direction_attribute.splitAttributeValue(input)).toStrictEqual(expected);
});
