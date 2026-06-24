import type { NodeTree } from "src/NodeTree"
import type { Selection } from "src/gl/Selection"
import type { IndyNode } from "src/nodes/IndyNode"
import { Material } from "src/nodes/Material"
import { Mesh } from "src/nodes/Mesh"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { jsx, replaceChildren, type HTMLElementProps, type JSX } from "toad.jsx/jsx-runtime"

export interface OutlinerProps extends HTMLElementProps {
    model: NodeTree
    selection: Selection
}

// Exclude from View Layer (checkbox shown for collections)
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

// Single selections will also activate the data-block. 
// * The rows of selected data-blocks are highlighted blue, with 
// * the active data-block highlighted in a lighter blue.

export function OutlineChevron(props?: { rotate?: number }) {
    return (
        <svg style={{
            width: 16,
            height: 16,
            transform: props?.rotate ? `rotate(${props.rotate}deg)` : undefined
        }}>
            <path stroke="currentcolor" stroke-width={1} fill="none" d="M 5 3 l 5 5 l -5 5" />
            {/* <rect x="0" y="0" width="16" height="16" stroke="currentcolor" fill="none"/> */}
        </svg>
    )
}

function node2html(node: IndyNode | undefined, map: Map<IndyNode, HTMLElement>, depth = 0): JSX.Element | undefined {
    if (node === undefined) { return }
    let name = node.constructor.name
    let icon: JSX.Element = <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>
    if (node instanceof Root) {
        name = "Crate"
        icon = <svg width="17" height="16"><use href="icons.svg#blender-collection" /></svg>
    }
    if (node instanceof XForm) {
        if (node.objectName) {
            name = node.objectName
        }
        icon = <svg width="16" height="16" style={{ color: "#bd7f4d" }}><use href="icons.svg#blender-outliner-obj-data" /></svg>
    }
    if (node instanceof Mesh) {
        if (node.dataName) {
            name = node.dataName
        }
        icon = <svg width="16" height="16" style={{ color: "#00c090" }}><use href="icons.svg#blender-outliner-data-mesh" /></svg>
    }
    if (node instanceof Material) {
        if (node.dataName) {
            name = node.dataName
        }
        icon = <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>
    }
    // console.log(`${"    ".repeat(depth)}${name}`)

    const children: JSX.Element[] = []
    for (let child of node.children) {
        const element = node2html(child, map, depth + 1)
        if (element) {
            children.push(element)
        }
    }

    let result: JSX.Element, item!: HTMLElement
    if (children.length) {
        result = <>
            <div ref={item} class="item" style={{ "padding-left": `${depth * 20}px` }}><OutlineChevron rotate={90} />{icon}{name}</div>
            <div class="indent">{...children}</div>
        </>
    } else {
        result = <div ref={item} class="item" style={{ "padding-left": `${depth * 20 + 12}px` }}>{icon}{name}</div>
    }
    map.set(node, item)
    item.onclick = (ev: PointerEvent) => {
        // const element = ev.target as HTMLElement
        node.context.selection.clear()
        node.context.selection.add(node)
        node.context.invalidate()
    }
    return result
}

/**
 * Display data of current file.
 */
export function Outliner(props: OutlinerProps) {

    // encodeURI("")
    // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="0" y="0" width="40" height="20" fill="#282828" stroke="none" /><rect x="0" y="20" width="40" height="20" fill="#2b2b2b" stroke="none" /></svg>

    let map: Map<IndyNode, HTMLElement>

    const updateFromSelection = () => {
        // console.log(`updateFromSelection: map ${map.entries}`)
        for (const [node, element] of map.entries()) {
            if (props.selection.isActive(node)) {
                element.classList.add("active")
                element.classList.remove("selected")
            } else if (props.selection.isSelected(node)) {
                element.classList.remove("active")
                element.classList.add("selected")
            } else {
                element.classList.remove("active", "selected")
            }
        }
    }

    props.model.signal.add(() => {
        // console.log(`Outliner: node tree changed`)
        map = new Map()
        const children = node2html(props.model.root, map)
        // console.log(children)
        replaceChildren(outliner, children)
        updateFromSelection()
    })
    props.selection.signal.add(updateFromSelection)

    let backgroundImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">`
        + `<rect x="0" y="0" width="40" height="20" fill="#282828" stroke="none" />`
        + `<rect x="0" y="20" width="40" height="20" fill="#2b2b2b" stroke="none" />`
        + `</svg>`

    // FIXME: seting the background via style={{backgroundImage: encodeURIComponent(backgroundImage)}} ain't working
    const outliner = <div class="outliner" ref={props.ref} /> as HTMLElement
    outliner.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(backgroundImage)}")`

    return outliner
}
