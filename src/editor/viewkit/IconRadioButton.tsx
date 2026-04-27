import type { RadioButtonProps } from "toad.js/viewkit/RadioButton"

export interface IconRadioButtonProps<V> extends RadioButtonProps<V> {
    svgHref: string
    title?: string
}

export function IconRadioButton<V>(props: IconRadioButtonProps<V>) {
    return (
        <div
            title={props.title}
            classList={{ 'tx-active': props.model!.value === props.value }}
            onpointerdown={() => props.model!.value = props.value}
        >
            <svg class="tool-icon">
                <use href={props.svgHref} />
            </svg>
        </div>
    )
}
