export interface KeyAndLoc {
    key: string,
    loc: number
}

// TBD: option map & dead keys

/**
 * from KeyboardEvent value for 'code', derive those for 'key' and 'location'
 * keyboard is assumed to be an international english keyboard
 * 
 * @param code 
 * @param shift 
 * @returns 
 */
export function code2keyAndLocation(code: string, shift: boolean): KeyAndLoc | undefined {
    let mapping
    if (shift) {
        mapping = shiftMap.get(code)
        if (mapping !== undefined) {
            return mapping
        }
    }
    mapping = normalMap.get(code)
    if (mapping !== undefined) {
        return mapping
    }
    if (code.startsWith("Key")) {
        if (shift) {
            return { key: code.substring(3), loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }
        } else {
            return { key: code.substring(3).toLowerCase(), loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }
        }
    }
    if (code.startsWith("Digit")) {
        return { key: code.substring(5), loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }
    }
    if (code.startsWith("Numpad")) {
        return { key: code.substring(6), loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }
    }
    return undefined
}

const normalMap = new Map<string, KeyAndLoc>([
    ["ShiftLeft", { key: "Shift", loc: KeyboardEvent.DOM_KEY_LOCATION_LEFT }],
    ["ShiftRight", { key: "Shift", loc: KeyboardEvent.DOM_KEY_LOCATION_RIGHT }],
    ["ControlLeft", { key: "Control", loc: KeyboardEvent.DOM_KEY_LOCATION_LEFT }],
    ["ControlRight", { key: "Control", loc: KeyboardEvent.DOM_KEY_LOCATION_RIGHT }],
    ["MetaLeft", { key: "Meta", loc: KeyboardEvent.DOM_KEY_LOCATION_LEFT }],
    ["MetaRight", { key: "Meta", loc: KeyboardEvent.DOM_KEY_LOCATION_RIGHT }],
    ["AltLeft", { key: "Alt", loc: KeyboardEvent.DOM_KEY_LOCATION_LEFT }],
    ["AltRight", { key: "Alt", loc: KeyboardEvent.DOM_KEY_LOCATION_RIGHT }],

    ["ArrowUp", { key: "ArrowUp", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["ArrowDown", { key: "ArrowDown", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["ArrowLeft", { key: "ArrowLeft", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["ArrowRight", { key: "ArrowRight", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],

    ["NumpadEqual", { key: "=", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["NumpadDivide", { key: "/", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["NumpadMultiply", { key: "*", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["NumpadSubtract", { key: "-", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["NumpadAdd", { key: "+", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],
    ["NumpadDecimal", { key: ".", loc: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD }],

    ["IntlBackslash", { key: "§", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Minus", { key: "-", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Equal", { key: "=", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["Tab", { key: "Tab", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["BracketLeft", { key: "[", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["BracketRight", { key: "]", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["CapsLock", { key: "CapsLock", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Semicolon", { key: ";", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Quote", { key: "'", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Backslash", { key: "\\", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Enter", { key: "Enter", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["Backquote", { key: "`", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Space", { key: " ", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Comma", { key: ",", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Period", { key: ".", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Slash", { key: "/", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["PageUp", { key: "PageUp", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["PageDown", { key: "PageDown", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Home", { key: "Home", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["End", { key: "End", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Delete", { key: "Delete", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Backspace", { key: "Backspace", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["F1", { key: "F1", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F2", { key: "F2", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F3", { key: "F3", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F4", { key: "F4", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F5", { key: "F5", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F6", { key: "F6", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F7", { key: "F7", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F8", { key: "F8", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F9", { key: "F9", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["F10", { key: "F10", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
])

const shiftMap = new Map<string, KeyAndLoc>([
    ["IntlBackslash", { key: "±", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit1", { key: "!", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit2", { key: "@", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit3", { key: "#", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit4", { key: "$", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit5", { key: "%", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit6", { key: "^", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit7", { key: "&", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit8", { key: "*", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit9", { key: "(", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Digit0", { key: ")", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Minus", { key: "_", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Equal", { key: "+", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["BracketLeft", { key: "{", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["BracketRight", { key: "}", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["Semicolon", { key: ":", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Quote", { key: "\"", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Backslash", { key: "|", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],

    ["Backquote", { key: "~", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Comma", { key: "<", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Period", { key: ">", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
    ["Slash", { key: "?", loc: KeyboardEvent.DOM_KEY_LOCATION_STANDARD }],
])
