import type { RadioButtonProps } from "toad.js/viewkit/RadioButton"

export interface IconRadioButtonProps<V> extends RadioButtonProps<V> {
    svgHref: string
    title?: string
}

export function IconRadioButton<V>(props: IconRadioButtonProps<V>) {
    // we could attempt to use Solid JSX's reactivity approach here
    const comp = <div title={props.title}>
        <svg class="tool-icon">
            <use href={props.svgHref} />
        </svg>
    </div> as HTMLDivElement

    const model = props.model
    if (model) {
        comp.classList.toggle("tx-active", model.value === props.value)
        model.signal.add(() => {
            comp.classList.toggle("tx-active", model.value === props.value)
        })
        comp.onpointerdown = () => {
            model.value = props.value
        }
    }
    return comp
}
