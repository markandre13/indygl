import { ValueModel } from "toad.js/appkit/ValueModel"
import type { HTMLElementProps } from "toad.jsx/jsx-runtime"

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
}

const model = new ListModel([
    new ShapeKey("Basis"),
    new ShapeKey("Key_1"),
    new ShapeKey("Key_2"),
])

const selection = new ValueModel<ShapeKey | null>(null)

export function ListBox() {
    let list!: HTMLElement
    return <>
        <div class="listbox">
            <div ref={list} class="list" tabIndex={0}>
                {model.value.map(it =>
                    <div
                        onclick={() => { 
                            list.focus()
                            selection.value = it
                        }}
                        classList={{ "tx-active": it === selection.value }}
                    >
                        {it.name} {it.value.toFixed(3)}
                    </div>
                )}
            </div>
            <div class="list-buttons">
                <button
                    onclick={() => model.push(new ShapeKey("new"))}
                >+</button>
                <button>-</button>
            </div>
        </div>
    </>
}
