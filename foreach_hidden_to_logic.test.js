import { jest } from '@jest/globals';
import { migrate } from "./foreach_hidden_to_logic.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("foreach/hidden属性→logic属性マイグレーション", () => {
    it("foreach属性のみをlogic属性に変換する", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<Grid foreach="${items}"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="foreach:${items}"');
        expect(xml).not.toContain("foreach=");
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it("hidden属性のみをlogic属性に変換する", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<Text hidden="${isHidden}"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="if:${isHidden}"');
        expect(xml).not.toContain("hidden=");
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it("foreach/hidden属性値に前後空白があっても正しく判定される", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<Grid foreach="  ${items}  " hidden="  ${isHidden}  "/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="foreach:${items}"');
        expect(xml).not.toContain("foreach=");
        expect(xml).toContain('hidden="  ${isHidden}  "'); // hiddenはlogic化されない
        spy.mockRestore();
    });

    it("foreach/hidden属性値が空白のみの場合は変換・警告しない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<Grid foreach="   " hidden="   "/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).not.toContain("logic=");
        expect(xml).not.toContain("foreach=");
        expect(xml).not.toContain("hidden=");
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it("foreach属性とhidden属性が両方ある場合はforeachのみlogic化し、hiddenは警告のみで変換しない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<Grid foreach="${items}" hidden="isHidden"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="foreach:${items}"');
        expect(xml).not.toContain("foreach=");
        expect(xml).toContain('hidden="isHidden"');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("既にlogic属性がある場合は警告し、変換しない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = '<?xml version="1.0" encoding="UTF-8"?>\n<Grid foreach="${items}" logic="foo"/>';
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('foreach="${items}"');
        expect(xml).toContain('logic="foo"');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("foreach値がバインド変数でない場合は変換後に警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Grid foreach="[]"/>`;
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="foreach:[]"');
        expect(xml).not.toContain("foreach=");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it("hidden値がバインド変数でない場合は変換後に警告を出す", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const inputXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Text hidden="true"/>`;
        const yrtRoot = toYrtRoot({ layouts: [inputXml] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const xml = layouts[0];
        expect(xml).toContain('logic="if:true"');
        expect(xml).not.toContain("hidden=");
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
