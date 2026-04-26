import { SpringLayout } from "./SpringLayout"

export function MainScreen() {

    let menubar: HTMLElement = undefined as any,
        toolbar: HTMLElement = undefined as any,
        canvas: HTMLElement = undefined as any,
        panel: HTMLElement = undefined as any,
        status: HTMLElement = undefined as any

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
        <canvas ref={canvas} class="canvas"></canvas>
        <div ref={panel} class="panel">
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

