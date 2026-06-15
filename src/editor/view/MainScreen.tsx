import { SpringLayout } from "../viewkit/SpringLayout"
import type { EditorModel } from "../app/EditorModel"
import { SelectionMode } from "../app/SelectionMode"
import { IconRadioButton } from "../viewkit/IconRadioButton"
import { ViewportShading } from "../app/ViewportShading"
import { TripleInput } from "../viewkit/TripleInput"
import { IconKey, IconMouseLeft, IconMouseMiddle, IconMouseRight, IconOption, IconShift } from "../viewkit/InputIcons"

export function MainScreen(props: { model: EditorModel }) {
    let menubar!: HTMLElement, toolbar!: HTMLElement, canvas!: HTMLElement, panel!: HTMLElement, status!: HTMLElement,
        overlay!: HTMLElement, svg!: SVGElement
    const selectionMode = props.model.selectionMode
    const viewportShading = props.model.viewportShading
    const transform = props.model.transform

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
        <svg ref={svg} class="overlay" id="svg-overlay"></svg>
        <div ref={overlay} class="overlay" id="overlay"></div>
        <div ref={panel} class="panel">
            Transform<br />
            Location:<br />
            <TripleInput model={transform.translation} />
            Rotation<br />
            <TripleInput model={transform.rotation} />
            XZY Euler<br />
            Scale<br />
            <TripleInput model={transform.scale} />
            Dimensions<br />
            <TripleInput model={transform.dimensions} />
        </div>
        <div ref={status} class="status" id="status">
            <IconMouseLeft /><span>Select</span>
            <IconMouseMiddle /><span>Rotate View</span>
            <IconMouseRight /><span>Options</span>
            <IconKey key="W" />
            <IconKey key="A" />
            <IconKey key="S" />
            <IconKey key="D" />
            <IconShift />
            <IconOption />
        </div>
    </div>

    SpringLayout.create()
        .element(menubar).top().left().right()
        .element(toolbar).top(menubar).left().right()
        .element(canvas).top(toolbar).left().bottom(status).right(panel)
        .element(overlay).top(toolbar).left().bottom(status).right(panel)
        .element(svg).top(toolbar).left().bottom(status).right(panel)
        .element(panel).top(toolbar).right().bottom(status)
        .element(status).bottom().left().right()
        .build()
    return root
}
