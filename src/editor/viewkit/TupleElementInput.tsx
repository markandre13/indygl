import BigNumber from "bignumber.js"
import type { UnitModel } from "../appkit/units/UnitModel"
import { Chevron } from "./Chevron"
import { makeRef, type HTMLElementProps } from "toad.jsx/jsx-runtime"

interface TupleElementInputProps extends HTMLElementProps {
    model: UnitModel
    edit?: boolean
}

// TODO: shift key jumps instead of moving from the current position
//       blender has that too and i don't like it. similar to switching axes during object grab
// TODO: does blender limit the decimal places?
//       display limits to 4 decimal places, when editing 5 decimal places are shown, mouse changes are stored up to 6 decimal places
//       drag changes the 2nd decimal place, shift+drag changes the 3rd decimal place
export function TupleElementInput(props: TupleElementInputProps) {
    let oldValue!: BigNumber
    let pointerDownX: number | undefined
    let input = makeRef<HTMLInputElement>()
    let capture = makeRef()
    let moved!: boolean
    const e = <div
        classList={{
            'gl-input': true,
            'tx-error': false /*props.model.error !== undefined*/
        }}
    >
        <button onclick={props.model.decrement}>
            <Chevron rotate={180} />
        </button>
        <div ref={capture}
            oncontextmenu={(e) => e.preventDefault()}
            onwheel={(e: WheelEvent) => {
                e.preventDefault()
                let step = BigNumber(props.model.step ? props.model.step : 1)
                if (e.shiftKey) {
                    step = step.div(10)
                }
                if (e.ctrlKey) {
                    step = step.times(10)
                }

                let value = props.model.value
                if (e.deltaY > 0) {
                    value = value.minus(step)
                }
                if (e.deltaY < 0) {
                    value = value.plus(step)
                }

                if (e.ctrlKey) {
                    value = value.div(step).decimalPlaces(0).times(step)
                }

                props.model.value = props.model.clip(value)
            }}
            onpointerdown={(e: PointerEvent) => {
                const target = e.target as HTMLElement
                target.setPointerCapture(e.pointerId)

                // https://stackoverflow.com/questions/10750582/global-override-of-mouse-cursor-with-javascript
                // keep col-resize cursor while dragginng
                const cursorStyle = document.createElement('style')
                cursorStyle.innerHTML = '*{cursor: col-resize!important;}'
                cursorStyle.id = 'cursor-style'
                document.head.appendChild(cursorStyle)

                e.preventDefault()
                oldValue = BigNumber(props.model.value)
                pointerDownX = e.clientX
            }}
            onpointerup={(e: PointerEvent) => {
                e.preventDefault()
                if (!moved) {
                    input.current.focus()
                    input.current.select()
                }
            }}
            onpointermove={(e: PointerEvent) => {
                e.preventDefault()

                if (pointerDownX === undefined) {
                    return
                }
                moved = true

                let step = BigNumber(props.model.step ? props.model.step : 1)

                if (e.shiftKey) {
                    step = step.div(10)
                }
                if (e.ctrlKey) {
                    step = step.times(10)
                }

                let value = oldValue.plus(step.times(Math.round(e.clientX - pointerDownX)))

                if (e.ctrlKey) {
                    value = value.div(step).decimalPlaces(0).times(step)
                }
                props.model.value = props.model.clip(value)
            }}
            onlostpointercapture={(e) => {
                if (moved) {
                    moved = false
                    input.current.blur()
                }
                pointerDownX = undefined

                document.getElementById('cursor-style')?.remove()
            }}
        >
            <div class="label">{props.model.label}</div>
            <div class="value">{() => `${props.model.value.toFixed(4)} ${props.model.symbol}`.trim()}</div>
            <input
                ref={input}
                value={`${props.model.value} ${props.model.symbol}`.trim()}
                onchange={() => {
                    // TODO: minimum decimal places when moving
                    props.model.value = input.current.value
                }}
            />
        </div>
        <button onclick={props.model.increment}><Chevron /></button>
    </div>
    if (props.edit) {
        requestAnimationFrame(() => { input.current.focus() })
    }
    return e
}
