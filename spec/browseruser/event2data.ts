import { forEachProperty } from "./forEachProperty"

let lastType = ""

/**
 * convert event into serializeable data
 */
export function event2data(ev: Event) {
    const data = {
        className: ev.constructor.name
    } as any
    forEachProperty(ev, (_className, propertyName) => {
        if (propertyName[0]?.toLowerCase() !== propertyName[0]) {
            return
        }
        const value = (ev as any)[propertyName]
        switch (typeof value) {
            case 'number':
                data[propertyName] = Math.round(value * 1000) / 1000
                break
            case 'boolean':
            case 'string':
                data[propertyName] = value
                break
            case 'object':
                if (value instanceof HTMLElement) {
                    data[propertyName] = value.dataset["testid"]
                } else {
                    if (value === null) {
                        data[propertyName] = null
                    } else {
                        data[propertyName] = value.constructor.name
                    }
                }
                break
            // default:
            //     console.log(`${propertyName}: ${typeof value}`)
        }
    })

    // if (ev.type !== lastType) {
    //     console.log(`${data.target} ${data.type}`)
    //     lastType = ev.type
    // }

    return data
}
