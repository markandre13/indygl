import type { RadioButtonProps } from "toad.js/viewkit/RadioButton"

export interface PropertyTabButtonProps<V> extends RadioButtonProps<V> {
    title?: string,
    color: string,
    svgHref: string,
}

export function PropertyTabButton<V>(props: PropertyTabButtonProps<V>) {
    return (
        <div
            title={props.title}
            classList={{ 'tx-active': () => props.model!.value === props.value }}
            onpointerdown={() => props.model!.value = props.value}
        >
            <svg width="16" height="16" style={{ color: props.color }}>
                <use href={props.svgHref} />
            </svg>
        </div>
    )
}
