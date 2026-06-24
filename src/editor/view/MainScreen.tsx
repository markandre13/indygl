import { SpringLayout } from "../viewkit/SpringLayout"
import type { EditorModel } from "../app/EditorModel"
import { SelectionMode } from "../app/SelectionMode"
import { IconRadioButton } from "../viewkit/IconRadioButton"
import { ViewportShading } from "../app/ViewportShading"
import { TripleInput } from "../viewkit/TripleInput"
import { IconKey, IconMouseLeft, IconMouseMiddle, IconMouseRight, IconOption, IconShift } from "../viewkit/InputIcons"
import { TransformOrientation } from "../app/TransformOrientation"
import { Slider } from "toad.js/viewkit/Slider"
import { Outliner } from "./Outliner"
import type { HTMLElementProps } from "toad.jsx/jsx-runtime"
import type { NodeTree } from "src/NodeTree"

interface MainScreenProps extends HTMLElementProps {
    model: EditorModel
    nodeTree: NodeTree
}

export function MainScreen(props: MainScreenProps) {
    let menubar!: HTMLElement, toolbar!: HTMLElement,
        overlay!: HTMLElement, svg!: SVGElement, canvas!: HTMLElement,
        outliner!: HTMLElement, panel!: HTMLElement,
        status!: HTMLElement
    const selectionMode = props.model.selectionMode
    const viewportShading = props.model.viewportShading
    const transformOrientation = props.model.transformOrientation
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
                <IconRadioButton model={viewportShading} value={ViewportShading.WIREFRAME_XRAY}
                    title="Viewport Shading: Wireframe X-Ray&#013;Display only edges of geometry without surface shading.&#013;Transparent scene display to allow selecting through items."
                    svgHref="icons.svg#icon-shading-wireframe-xray" />
                <IconRadioButton model={viewportShading} value={ViewportShading.WIREFRAME}
                    title="Viewport Shading: Wireframe&#013;Display only edges of geometry without surface shading."
                    svgHref="icons.svg#icon-shading-wireframe" />
                <IconRadioButton model={viewportShading} value={ViewportShading.SOLID_XRAY}
                    title="Viewport Shading: Solid X-Ray&#013;Display objects with flat lightning and basic surface shading.&#013;Transparent scene display to allow selecting through items."
                    svgHref="icons.svg#icon-shading-solid-xray" />
                <IconRadioButton model={viewportShading} value={ViewportShading.SOLID}
                    title="Viewport Shading: Solid&#013;Display objects with flat lightning and basic surface shading."
                    svgHref="icons.svg#icon-shading-solid" />
                <IconRadioButton model={viewportShading} value={ViewportShading.MATERIAL_PREVIEW}
                    title="Viewport Shading: Material Preview&#013;Preview materials using predefined environment lights."
                    svgHref="icons.svg#icon-shading-textured" />
            </div>
            <div>
                <IconRadioButton model={transformOrientation} value={TransformOrientation.GLOBAL}
                    title="Transformation Orientation: Global&#013;Align the transformation axes to the world space."
                    svgHref="icons.svg#icon-transform-orientation-global" />
                <IconRadioButton model={transformOrientation} value={TransformOrientation.LOCAL}
                    title="Transformation Orientation: Local&#013;Align the transformation axes to the selected object's local space."
                    svgHref="icons.svg#icon-transform-orientation-local" />
            </div>
        </div>
        <canvas ref={canvas} class="canvas" tabIndex={0}></canvas>
        <svg ref={svg} class="overlay" id="svg-overlay" />
        <div ref={overlay} class="overlay" id="overlay" />
        <Outliner ref={outliner} model={props.nodeTree} />
        <div ref={panel} class="panel">
            Transform<br />
            Location:<br />
            <TripleInput model={transform.translation} />
            Rotation<br />
            <TripleInput model={transform.rotation} />
            XZY Euler<br />
            Scale<br />
            <TripleInput model={transform.scale} />
            {/* Dimensions<br />
            <TripleInput model={transform.dimensions} /> */}

            Morph<br />
            <Slider model={props.model.morph} />

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
        .element(outliner).top(toolbar).bottom(panel).right()
        .element(panel).right().bottom(status)
        .element(status).bottom().left().right()
        .build()
    return root
}
