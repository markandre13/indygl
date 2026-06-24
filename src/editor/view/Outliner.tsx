import { replaceChildren, type HTMLElementProps, type JSX } from "toad.jsx/jsx-runtime"
import { Chevron } from "../viewkit/Chevron"
import type { NodeTree } from "src/NodeTree"
import type { IndyNode } from "src/nodes/IndyNode"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { Mesh } from "src/nodes/Mesh"

export interface OutlineProps extends HTMLElementProps {
    model: NodeTree
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

function walk(node: IndyNode | undefined, depth = 0): JSX.Element | undefined {
    if (node === undefined) { return }
    let name = node.constructor.name
    let icon: JSX.Element = <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>
    if (node instanceof Root) {
        name = "Scene Collection"
        icon = <svg width="17" height="16"><use href="icons.svg#blender-collection" /></svg>
    }
    if (node instanceof XForm) {
        if (node.objectName) {
            name = node.objectName
        }
        icon = <svg width="16" height="16" style={{ color: "#bd7f4d" }}><use href="icons.svg#blender-outliner-obj-mesh" /></svg>
    }
    if (node instanceof Mesh) {
        if (node.dataName) {
            name = node.dataName
        }
        icon = <svg width="16" height="16" style={{ color: "#00c090" }}><use href="icons.svg#blender-outliner-data-mesh" /></svg>
    }
    // console.log(`${"    ".repeat(depth)}${name}`)

    const children: JSX.Element[] = []
    for (let child of node.children) {
        const element = walk(child, depth + 1)
        if (element) {
            children.push(element)
        }
    }

    const item = <div class="item">
        {icon}{name}
    </div>

    if (children.length) {
        return <>
            {item}
            <div class="indent">{...children}</div>
        </>
    } else {
        return item
    }
}

/**
 * Overview of Scene-graph and all available data blocks
 */
export function Outliner(props: OutlineProps) {

    // encodeURI("")
    // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="0" y="0" width="40" height="20" fill="#282828" stroke="none" /><rect x="0" y="20" width="40" height="20" fill="#2b2b2b" stroke="none" /></svg>

    props.model.signal.add(() => {
        console.log(`Outliner: node tree changed`)
        const children = walk(props.model.root)
        console.log(children)
        replaceChildren(outliner, children)
    })

    let x = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="0" y="0" width="40" height="20" fill="#282828" stroke="none" /><rect x="0" y="20" width="40" height="20" fill="#2b2b2b" stroke="none" /></svg>`

    // FIXME: set the background via style={{backgroundImage: encodeURIComponent(x)}} ain't working
    const outliner = <div class="outliner" ref={props.ref}>
        {/* <div class="item">
            <svg width="17" height="16"><use href="icons.svg#blender-collection" /></svg>
            Scene Collection
        </div>
        <div class="indent">
            <div class="item">
                <Chevron rotate={90} /><svg width="16" height="16"><use href="icons.svg#blender-collection" /></svg>
                Collection
            </div>
            <div class="indent">
                <div class="item">
                    <Chevron rotate={90} /><svg width="16" height="16" style={{ color: "#bd7f4d" }}><use href="icons.svg#blender-outliner-obj-mesh" /></svg>
                    Cube
                </div>
                <div class="indent">
                    <div class="item">
                        <Chevron rotate={90} /><svg width="16" height="16" style={{ color: "#00c090" }}><use href="icons.svg#blender-outliner-data-mesh" /></svg>
                        Cube Data
                    </div>
                    <div class="indent">
                        <div class="item" style={{ "padding-left": `${9}px` }}>
                            <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>
                            Material
                        </div>
                    </div>
                </div>
            </div>
        </div> */}
    </div> as HTMLElement

    outliner.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(x)}")`

    return outliner
}
