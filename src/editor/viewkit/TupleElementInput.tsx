import BigNumber from "bignumber.js"
import { hasFocus } from "toad.js/util/dom"
import type { UnitModel } from "../appkit/units/UnitModel"
import { Chevron } from "./Chevron"

export function TupleElementInput(props: { model: UnitModel; edit?: boolean }) {
    let oldValue!: BigNumber
    let pointerDownX: number | undefined
    let input!: HTMLInputElement
    let capture!: HTMLDivElement
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
                e.preventDefault()
                if (!hasFocus(input)) {
                    input.focus();
                    (e.target as HTMLElement).setPointerCapture(e.pointerId)
                    oldValue = BigNumber(props.model.value)
                    pointerDownX = e.clientX
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
            onlostpointercapture={() => {
                if (moved) {
                    console.log("lost capture")
                    moved = false
                    input.blur()
                }
                pointerDownX = undefined
            }}
        >
            <div class="label">{props.model.label}</div>
            <div class="value">{() => `${props.model.value.toString()} ${props.model.symbol}`.trim()}</div>
            <input
                ref={input}
                value={`${props.model.value} ${props.model.symbol}`.trim()}
                onchange={() => {
                    props.model.value = input.value
                }} />
        </div>
        <button onclick={props.model.increment}><Chevron /></button>
    </div>
    if (props.edit) {
        requestAnimationFrame(() => { input.focus() })
    }
    return e
}
