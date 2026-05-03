
export function Chevron(props: { rotate?: number} ) {
    return (
        <svg class="tool-icon" style={{
            width: 12,
            height: 12,
            transform: props.rotate ? `rotate(${props.rotate}deg)` : undefined
        }}>
            <path stroke="currentcolor" stroke-width={2} fill="none" d="M 4 3 l 3 3 l -3 3" />
        </svg>
    )
}
