import { SpringLayout } from "../viewkit/SpringLayout"
import type { EditorModel } from "../app/EditorModel"
import { SelectionMode } from "../app/SelectionMode"
import { IconRadioButton } from "../viewkit/IconRadioButton"
import { PropertyTabButton } from "../viewkit/PropertyTabButton"
import { ViewportShading } from "../app/ViewportShading"
import { TripleInput } from "../viewkit/TripleInput"
import { IconKey, IconMouseLeft, IconMouseMiddle, IconMouseRight, IconOption, IconShift } from "../viewkit/InputIcons"
import { TransformOrientation } from "../app/TransformOrientation"
import { Outliner } from "./Outliner"
import { makeRef, type HTMLElementProps } from "toad.jsx/jsx-runtime"
import type { ObjectSelection } from "src/gl/ObjectSelection"
import { PropertyTab } from "../app/PropertyTab"
import { If } from "toad.js/viewkit/If"
import { ListBox } from "./ListBox"
import { Mesh } from "src/nodes/Mesh"
import { Material } from "src/nodes/Material"
import { BlendShapeGroup } from "src/nodes/BlendShapeGroup"
import { XForm } from "src/nodes/XForm"
import type { Root } from "src/nodes/IndyNode"

interface MainScreenProps extends HTMLElementProps {
    model: EditorModel
    selection: ObjectSelection
    root: Root
}

export function MainScreen(props: MainScreenProps) {
    let menubar = makeRef(), toolbar = makeRef(),
        overlay = makeRef(), svg = makeRef<SVGElement>(), canvas = makeRef(),
        outliner = makeRef(), panel = makeRef(),
        status = makeRef()

    // for the controls in the toolbar
    const selectionMode = props.model.selectionMode
    const viewportShading = props.model.viewportShading
    const transformOrientation = props.model.transformOrientation

    // for the controls in the property panel
    const propertyTab = props.model.propertyTab
    const transform = props.model.transform

    const root = <div class="main">
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
        <Outliner ref={outliner} root={props.root} objectSelection={props.selection} propertyTab={propertyTab}/>

        <div ref={panel} class="panel">
            <div class="panel-tabs">
                <PropertyTabButton model={propertyTab} value={XForm.uiHints.propertyTab}
                    title="Object&#013;Object Properties"
                    color={XForm.uiHints.color}
                    svgHref={XForm.uiHints.icon}
                />
                <PropertyTabButton model={propertyTab} value={Mesh.uiHints.propertyTab}
                    title="Data&#013;Object Data Properties"
                    color={Mesh.uiHints.color}
                    svgHref={Mesh.uiHints.icon}
                />
                <PropertyTabButton model={propertyTab} value={PropertyTab.VERTEX_GROUPS}
                    title="Vertex Group&#013;Object Data Vertex Group Properties"
                    color="#6387d2"
                    svgHref="icons.svg#blender-group-vertex"
                />
                <PropertyTabButton model={propertyTab} value={BlendShapeGroup.uiHints.propertyTab}
                    title="Shape Key&#013;Object Data Shape Key Properties"
                    color={BlendShapeGroup.uiHints.color}
                    svgHref={BlendShapeGroup.uiHints.icon}
                />
                <PropertyTabButton model={propertyTab} value={Material.uiHints.propertyTab}
                    title="Material&#013;Material Properties"
                    color={Material.uiHints.color}
                    svgHref={Material.uiHints.icon}
                />
            </div>
            <div class="panel-data">
                <If model={propertyTab} isEqual={PropertyTab.OBJECT}>
                    <div class="panel-edit">
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
                        {/* Morph<br />
                    <Slider model={props.model.morph} /> */}
                    </div>
                </If>
                <If model={propertyTab} isEqual={PropertyTab.SHAPE_KEY}>
                    <ListBox />
                    <div class="panel-edit">
                        File
                    </div>
                    <div class="panel-edit">
                        Mapping
                    </div>
                </If>
            </div>
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
        .element(outliner).top(toolbar).right()
        .element(panel).right().top(outliner).bottom(status)
        .element(status).bottom().left().right()
        .build()
    return root
}
