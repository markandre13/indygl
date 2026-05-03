import type { TripleModel } from "../appkit/TripleModel"
import { TupleElementInput } from "./TupleElementInput"

export function TripleInput(props: { model: TripleModel} ) {
    return (
        <div>
            <TupleElementInput model={props.model.x} />
            <TupleElementInput model={props.model.y} />
            <TupleElementInput model={props.model.z} />
        </div>
    )
}
