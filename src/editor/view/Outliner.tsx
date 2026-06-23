import type { HTMLElementProps } from "toad.jsx/jsx-runtime"
import type { EditorModel } from "../app/EditorModel"
import { Chevron } from "../viewkit/Chevron"

export interface OutlineProps extends HTMLElementProps {
    model: EditorModel
}

// Exclude from View Layer (shown for collections)
// Hide in Viewport (the open/closed eye)
//   for collections:
//     Temporarily hide in viewport
//     * Ctrl to isolate selection
//     * Shift to set inside collections and objects
//   others:
//     Temporarily hide in viewport
//     * Shift to set children
// Disable in Renders (the camera) ;; IndyGL doesn't render
//     Globally disable in renders

/**
 * Overview of Scene-graph and all available data blocks
 */
export function Outliner(props: OutlineProps) {
    // props.model.

    return <div class="outliner" ref={props.ref}>
        <div>
            <svg width="17" height="16"><use href="icons.svg#blender-collection" /></svg>
            Scene Collection
        </div>
        <div style={{"padding-left": "9px"}}>
            <Chevron rotate={90} /><svg width="16" height="16"><use href="icons.svg#blender-collection" /></svg>
            Collection
        </div>
        <div style={{"padding-left": "18px"}}>
            <Chevron rotate={90} /><svg width="16" height="16" style={{ color: "#bd7f4d" }}><use href="icons.svg#blender-outliner-obj-mesh" /></svg>
            Cube
        </div>
        <div style={{"padding-left": "27px"}}>
            <Chevron rotate={90} /><svg width="16" height="16" style={{ color: "#00c090" }}><use href="icons.svg#blender-outliner-data-mesh" /></svg>
            Cube Data
        </div>
        <div style={{"padding-left": `${36+20}px`}}>
            <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>
            Material
        </div>
    </div>
}
