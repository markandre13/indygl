import { SpringLayout } from "../viewkit/SpringLayout"
import type { EditorModel } from "../app/EditorModel"
import { SelectionMode } from "../app/SelectionMode"
import { IconRadioButton } from "../viewkit/IconRadioButton"
import { ViewportShading } from "../app/ViewportShading"
import { LengthModel } from "appkit/units/LengthModel"
import type { UnitModel } from "../appkit/units/UnitModel"
import { RotationModel } from "../appkit/units/RotationModel"

// https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/control/numeric_input.html

// number, unit
// rename Signal into Emitter to avoid name clash with tc39 signals?

const tx = new LengthModel(0, { label: "X", step: 0.01 })
const ty = new LengthModel(0, { label: "Y", step: 0.01 })
const tz = new LengthModel(0, { label: "Z", step: 0.01 })

const rx = new RotationModel(0, { label: "X", step: 0.01 })
const ry = new RotationModel(0, { label: "Y", step: 0.01 })
const rz = new RotationModel(0, { label: "Z", step: 0.01 })

export function Chevron(props: { rotate?: number }) {
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

export function TupleInput(props: { model: UnitModel, edit?: boolean }) {
    let input!: HTMLInputElement
    const e = <div
        classList={{
            'gl-input': true,
            'tx-error': false /*props.model.error !== undefined*/
        }}
        onpointerdown={() => {
            console.log(`set focus to`)
            console.log(input)
            input.focus()
        }}
    >
        <button onclick={props.model.decrement}>
            <Chevron rotate={180} />
        </button>
        <div>
            <div class="label">{props.model.label}</div>
            <div class="value">{() => `${props.model.value.toString()} ${props.model.symbol}`}</div>
            <input
                ref={input}
                value={`${props.model.value} ${props.model.symbol}`}
                onchange={() => {
                    props.model.value = input.value
                }}
            />
        </div>
        <button onclick={props.model.increment}><Chevron /></button>
    </div>
    if (props.edit) {
        requestAnimationFrame(() => { input.focus() })
    }
    return e
}

export function MainScreen(props: { model: EditorModel }) {
    let menubar!: HTMLElement, toolbar!: HTMLElement, canvas!: HTMLElement, panel!: HTMLElement, status!: HTMLElement

    const selectionMode = props.model.selectionMode
    const viewportShading = props.model.viewportShading

    const root = <div style={{ width: "100vw", height: "100vh" }}>
        <div ref={menubar} class="menubar">
            <div>File</div>
            <div>Edit</div>
            <div>Render</div>
            <div>Window</div>
            <div>Help</div>
            <Chevron />
        </div>
        <div ref={toolbar} class="toolbar">
            <div>
                <IconRadioButton model={selectionMode} value={SelectionMode.OBJECT} title="Object Selection Mode" svgHref="icons.svg#icon-select-object" />
                <IconRadioButton model={selectionMode} value={SelectionMode.POINT} title="Point Selection Mode" svgHref="icons.svg#icon-select-point" />
                <IconRadioButton model={selectionMode} value={SelectionMode.EDGE} title="Edge Selection Mode" svgHref="icons.svg#icon-select-edge" />
                <IconRadioButton model={selectionMode} value={SelectionMode.FACE} title="Face Selection Mode" svgHref="icons.svg#icon-select-face" />
            </div>
            <div>
                <IconRadioButton model={viewportShading} value={ViewportShading.WIREFRAME_XRAY} title="Viewport Shading Wireframe X-Ray" svgHref="icons.svg#icon-shading-wireframe-xray" />
                <IconRadioButton model={viewportShading} value={ViewportShading.WIREFRAME} title="Viewport Shading Wireframe" svgHref="icons.svg#icon-shading-wireframe" />
                <IconRadioButton model={viewportShading} value={ViewportShading.SOLID_XRAY} title="Viewport Shading Solid X-Ray" svgHref="icons.svg#icon-shading-solid-xray" />
                <IconRadioButton model={viewportShading} value={ViewportShading.SOLID} title="Viewport Shading Solid" svgHref="icons.svg#icon-shading-solid" />
                <IconRadioButton model={viewportShading} value={ViewportShading.TEXTURED} title="Viewport Shading Textured" svgHref="icons.svg#icon-shading-textured" />
            </div>
        </div>
        <canvas ref={canvas} class="canvas"></canvas>
        <div ref={panel} class="panel">
            Transform<br />
            Location:<br />
            <div>
                <TupleInput model={tx} />
                <TupleInput model={ty} />
                <TupleInput model={tz} />
            </div>
            Rotation<br />
           <div>
                <TupleInput model={rx} />
                <TupleInput model={ry} />
                <TupleInput model={rz} />
            </div>
            XZY Euler<br />
            Scale<br />
            <div class="X">X 1.000</div>
            <div class="Y">Y 1.000</div>
            <div class="Z">Z 1.000</div>
            Dimensions<br />
            <div class="X">X 2 m</div>
            <div class="Y">Y 2 m</div>
            <div class="Z">Z 2 m</div>
        </div>
        <div ref={status} class="status">Select Rotate View Options</div>
    </div>

    //  the definition below sucks. how about ascii art:
    //
    //    menubar
    //    toolbar
    //    canvas panel
    //    status
    //
    // or 
    //
    //  menubar { form <- top, left, right }
    //  toolbar { menubar <- top, left, form <- right }
    //  canvas { toolbar <- top, status <- bottom -> status, form <- left, panel <- right }
    //  panel { toolbar <- top, status <- bottom , form <- right }
    //  status { form <- bottom, left, right  }
    //
    new SpringLayout([
        { element: menubar, where: ["top", "left", "right"] },
        { element: toolbar, where: ["top"], which: menubar },
        { element: toolbar, where: ["left", "right"] },
        { element: canvas, where: ["top"], which: toolbar },
        { element: canvas, where: ["left"] },
        { element: canvas, where: ["bottom"], which: status },
        { element: canvas, where: ["right"], which: panel },
        { element: panel, where: ["top"], which: toolbar },
        { element: panel, where: ["right"] },
        { element: panel, where: ["bottom"], which: status },
        { element: status, where: ["bottom", "left", "right"] },
    ])

    return root
}
