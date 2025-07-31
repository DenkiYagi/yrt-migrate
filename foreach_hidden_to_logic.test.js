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
        expect(spy.mock.calls.flat()).toEqual(expect.arrayContaining([
            expect.stringContaining('logic属性が既に存在するためhidden属性は変換しませんでした')
        ]));
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
        expect(spy.mock.calls.flat()).toEqual(expect.arrayContaining([
            expect.stringContaining('logic属性が既に存在するためforeach属性は変換しませんでした')
        ]));
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
        expect(spy.mock.calls.flat()).toEqual(expect.arrayContaining([
            expect.stringContaining('foreach属性の値「[]」はバインド変数ではありません。バインド変数しか指定できないので修正してください。')
        ]));
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
        expect(spy.mock.calls.flat()).toEqual(expect.arrayContaining([
            expect.stringContaining('hidden属性の値「true」はバインド変数ではありません。バインド変数しか指定できないので修正してください。')
        ]));
        spy.mockRestore();
    });
});
