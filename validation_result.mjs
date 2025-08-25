// @ts-check

/**
 * @template T
 * @typedef {{ type: 'success', value: T }} SuccessResult
 * 成功時の結果。`Result` 型等に代入可能
 */

/**
 * @template T
 * @typedef {{ type: 'warning', message: string, value: T }} WarningResult
 * 警告時の結果。`Result` 型等に代入可能
 */

/**
 * @typedef {{ type: 'error', message: string }} ErrorResult
 * エラー時の結果。`Result` 型等に代入可能
 */

/**
 * @template T
 * @typedef {SuccessResult<T> | ErrorResult} SimpleResult
 * バリデーション結果の成功またはエラーを表す判別共用体
 */

/**
 * @template T
 * @typedef {SuccessResult<T> | WarningResult<T> | ErrorResult} Result
 * バリデーション結果を表す判別共用体
 */

/**
 * `SuccessResult` 型の値を作成する
 * @template T
 * @param {T} value 成功時の値
 * @returns {SuccessResult<T>}
 */
export function success(value) {
    return { type: 'success', value };
}

/**
 * `WarningResult` 型の値を作成する
 * @template T
 * @param {T} value 警告時の値
 * @param {string} message 警告メッセージ
 * @returns {WarningResult<T>}
 */
export function warning(value, message) {
    return { type: 'warning', message, value };
}

/**
 * `ErrorResult` 型の値を作成する
 * @param {string} message エラーメッセージ
 * @returns {ErrorResult}
 */
export function error(message) {
    return { type: 'error', message };
}
