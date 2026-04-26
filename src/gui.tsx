import { replaceChildren } from "toad.jsx/jsx-runtime"
import { deg2rad } from "./gl/algorithms/deg2rad"
import { main } from "./main"

replaceChildren(document.body, <div style={{ width: "100vw", height: "100vh" }}>
    <div class="menubar">
        <div>File</div>
        <div>Edit</div>
        <div>Render</div>
        <div>Window</div>
        <div>Help</div>
    </div>
    <div class="toolbar">
        <div>
            <div title="Object Selection Mode">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-select-object" />
                </svg>
            </div>
            <div title="Point Selection Mode">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-select-point" />
                </svg>
            </div>
            <div title="Edge Selection Mode" class="tx-active">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-select-edge" />
                </svg>
            </div>
            <div title="Face Selection Mode">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-select-face" />
                </svg>
            </div>
        </div>
        <div>
            <div title="Viewport Shading Wireframe X-Ray">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-shading-wireframe-xray" />
                </svg>
            </div>
            <div title="Viewport Shading Wireframe">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-shading-wireframe" />
                </svg>
            </div>
            <div title="Viewport Shading Solid X-Ray">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-shading-solid-xray" />
                </svg>
            </div>
            <div title="Viewport Shading Solid" class="tx-active">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-shading-solid" />
                </svg>
            </div>
            <div title="Viewport Shading Textured">
                <svg class="tool-icon">
                    <use href="icons.svg#icon-shading-textured" />
                </svg>
            </div>
        </div>
    </div>
    <canvas class="canvas"></canvas>
    <div class="panel">
        Transform<br />
        Location:<br />
        <div class="X">X 0m</div>
        <div class="Y">Y 0m</div>
        <div class="Z">Z 0m</div>
        Rotation<br />
        <div class="X">X 0°</div>
        <div class="Y">Y 0°</div>
        <div class="Z">Z 0°</div>
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
    <div class="status">Select Rotate View Options</div>
</div>)

main()
