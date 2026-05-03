import { SpringLayout } from "../viewkit/SpringLayout"
import type { EditorModel } from "../app/EditorModel"
import { SelectionMode } from "../app/SelectionMode"
import { IconRadioButton } from "../viewkit/IconRadioButton"
import { ViewportShading } from "../app/ViewportShading"
import { TripleInput } from "../viewkit/TripleInput"
import { Vec3Model } from "../appkit/Vec3Model"
import { Rot3Model } from "../appkit/Rot3Model"
import { Scale3Model } from "../appkit/Scale3Model"

export function MainScreen(props: { model: EditorModel }) {
    let menubar!: HTMLElement, toolbar!: HTMLElement, canvas!: HTMLElement, panel!: HTMLElement, status!: HTMLElement

    const translation = new Vec3Model()
    const rotation = new Rot3Model()
    const scale = new Scale3Model()
    const dimensions = new Vec3Model()

    const selectionMode = props.model.selectionMode
    const viewportShading = props.model.viewportShading

    const root = <div style={{ width: "100vw", height: "100vh" }}>
        <div ref={menubar} class="menubar">
            <div>File</div>
            <div>Edit</div>
            <div>Render</div>
            <div>Window</div>
            <div>Help</div>
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
            <TripleInput model={translation} />
            Rotation<br />
            <TripleInput model={rotation} />
            XZY Euler<br />
            Scale<br />
            <TripleInput model={scale} />
            Dimensions<br />
            <TripleInput model={dimensions} />
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
