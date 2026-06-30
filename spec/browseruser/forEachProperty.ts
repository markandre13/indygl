
export function forEachProperty(obj: object, block: (className: string, propertyName: string) => void) {
    while (true) {
        for (const name of Object.getOwnPropertyNames(obj)) {
            block(obj.constructor.name, name)
        }
        let prev = obj
        obj = Object.getPrototypeOf(obj)
        if (!obj || obj === prev) {
            break
        }
    }
}
