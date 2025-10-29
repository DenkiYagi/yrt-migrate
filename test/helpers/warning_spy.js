import { setWarningHandler, clearWarningHandler } from "../../src/warn_with_location.mjs";

function createCollector() {
    const messages = [];
    return {
        collect(message) {
            const text = typeof message === "string" ? message : message.toString();
            messages.push(text);
            return true;
        },
        messages() {
            return messages.filter(message => message.startsWith("[WARNING]"));
        },
        clear() {
            messages.length = 0;
        }
    };
}

export function setupWarningSpy() {
    const collector = createCollector();
    const previous = setWarningHandler(collector.collect);
    return {
        messages: () => collector.messages(),
        restore() {
            clearWarningHandler(previous);
            collector.clear();
        }
    };
}

export function withWarningSpy(callback) {
    const spy = setupWarningSpy();
    try {
        const result = callback(spy);
        const warnings = spy.messages();
        spy.restore();
        return { warnings, result };
    } catch (error) {
        spy.restore();
        throw error;
    }
}
