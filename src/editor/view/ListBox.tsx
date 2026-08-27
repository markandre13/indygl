import { ValueModel } from "toad.js/appkit/ValueModel"
import { effect, makeRef, replaceChildren } from "toad.jsx/jsx-runtime"

// for now I'll ignore toad.js' ArrayTableModel and SelectionModel in the hope
// to come up with some easier to use APIs

class ShapeKey {
    name: string
    value: number
    min: number
    max: number
    constructor(name: string, value: number = 0, min: number = 0, max: number = 1) {
        this.name = name
        this.value = value
        this.min = min
        this.max = max
    }
}

class ListModel<T> extends ValueModel<T[]> {
    push(value: T) {
        this._value.push(value)
        this.signal.emit()
    }
    remove(value: T | null): T | null {
        if (value === null) { return null }
        let index = this._value.indexOf(value)
        if (index === -1) { return null }
        this._value.splice(index, 1)
        if (index >= this._value.length) {
            index = this._value.length - 1
        }
        this.signal.emit()
        if (index === -1) { return null }
        return this._value[index]
    }
}

const model = new ListModel([
    new ShapeKey("Basis"),
    new ShapeKey("Key 1"),
    new ShapeKey("Key 2"),
])

const selection = new ValueModel<ShapeKey | null>(null)

export function ListBox() {
    let list = makeRef()
    const listbox = <>
        <div class="listbox">
            <div ref={list} class="list" tabIndex={0}>
            </div>
            <div class="list-buttons">
                <button onclick={() => model.push(new ShapeKey("new"))}>+</button>
                <button onclick={() => selection.value = model.remove(selection.value)}>-</button>
            </div>
        </div>
    </>

    effect(() => {
        replaceChildren(list, model.value.map(it =>
            <div
                onclick={() => {
                    list.current.focus()
                    selection.value = it
                }}
                classList={{ "selected": it === selection.value }}
            >
                {it.name} {it.value.toFixed(3)}
            </div>
        ))
    })

    return listbox
}
