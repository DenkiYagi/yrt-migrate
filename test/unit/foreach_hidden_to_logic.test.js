import { migrate } from "../../src/migrate/foreach_hidden_to_logic.mjs";
import { withWarningSpy } from "../helpers/warning_spy.js";

describe("foreach/hidden属性→logic属性マイグレーション", () => {
    it("foreach属性のみをlogic属性に変換する", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Grid foreach="${items}"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('logic="foreach:${items}"');
        expect(xml).not.toContain("foreach=");
        expect(warnings).toHaveLength(0);
    });

    it("hidden属性のみをlogic属性に変換する、ただし真偽反転", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Text hidden="${isHidden}"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('logic="if:${!isHidden}"');
        expect(xml).not.toContain("hidden=");
        expect(warnings).toHaveLength(0);
    });

    it("foreach/hidden属性値に前後空白があっても同時指定なら変換しない", () => {
        const inputXml = '<Grid foreach="  ${items}  " hidden="  ${isHidden}  "/>';
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('foreach="  ${items}  "');
        expect(xml).toContain('hidden="  ${isHidden}  "');
        expect(xml).not.toContain('logic=');
        expect(warnings).toHaveLength(0);
    });

    it("foreach/hidden属性値が空白のみの場合は変換しない", () => {
        const inputXml = [
            '<Grid foreach="   " hidden="   "/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).not.toContain("logic=");
        expect(xml).not.toContain("foreach=");
        expect(xml).not.toContain("hidden=");
        expect(warnings).toHaveLength(0);
    });

    it("foreach属性とhidden属性が両方ある場合は変換しない", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Grid foreach="${items}" hidden="isHidden"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('foreach="${items}"');
        expect(xml).toContain('hidden="isHidden"');
        expect(xml).not.toContain('logic=');
        expect(warnings).toHaveLength(0);
    });

    it("foreach値がバインド変数でない場合は変換されない", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Grid foreach="[]"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('foreach="[]"');
        expect(xml).not.toContain('logic=');
        expect(warnings).toHaveLength(0);
    });

    it("hidden値がバインド変数でない場合は変換されない", () => {
        const inputXml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Text hidden="true"/>'
        ].join('\n');
        const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
        const { warnings, result: migrated } = withWarningSpy(() => migrate(yrtDocument, inputXml));
        const xml = migrated.layouts[0].xml;
        expect(xml).toContain('hidden="true"');
        expect(xml).not.toContain("logic='");
        expect(warnings).toHaveLength(0);
    });
});
