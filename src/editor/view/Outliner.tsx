import type { NodeTree } from "src/NodeTree"
import type { ObjectSelection } from "src/gl/ObjectSelection"
import type { IndyNode } from "src/nodes/IndyNode"
import { Material } from "src/nodes/Material"
import { Mesh } from "src/nodes/Mesh"
import { Root } from "src/nodes/Root"
import { XForm } from "src/nodes/XForm"
import { Model } from "toad.js/appkit/Model"
import type { OptionModel } from "toad.js/appkit/OptionModel"
import { replaceChildren, type HTMLElementProps, type JSX } from "toad.jsx/jsx-runtime"
import { PropertyTab } from "../app/PropertyTab"

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

class ListSelection<T> extends Model {
    private value = new Set<T>()
    add(...value: T[]) {
        // will change?
        let i = 0
        while (i < value.length) {
            if (!this.value.has(value[i])) {
                break
            }
            ++i
        }
        if (i === value.length) {
            return // ==> nope, return
        }

        for (let i = 0; i < value.length; ++i) {
            this.value.add(value[i])
        }
        this.signal.emit()
    }
    set(...value: T[]) {
        // will change?
        if (this.value.size === value.length) {
            let i = 0
            while (i < value.length) {
                if (!this.value.has(value[i])) {
                    break
                }
                ++i
            }
            if (i === value.length) {
                return // ==> nope, return
            }
        }

        this.value.clear()
        for (let i = 0; i < value.length; ++i) {
            this.value.add(value[i])
        }

        this.signal.emit()
    }
    delete(value: T) {
        if (!this.value.has(value)) {
            return
        }
        this.value.delete(value)
        this.signal.emit()
    }
    has(value: T) {
        return this.value.has(value)
    }
}

export interface OutlinerProps extends HTMLElementProps {
    nodeTree: NodeTree
    objectSelection: ObjectSelection
    propertyTab: OptionModel<PropertyTab>
}

// const selection = new ValueModel<ShapeKey | null>(null)

export function OutlineChevron(props?: {
    rotate?: number,
    onpointerdown?: (ev: PointerEvent) => void,
    onpointerup?: (ev: PointerEvent) => void,
    onclick?: (ev: PointerEvent) => void,
    ref?: unknown | ((e: unknown) => void) | undefined
}) {
    // TODO: need to extend toad.jsx to handle this as tag
    const svgNS = "http://www.w3.org/2000/svg"
    const rect = document.createElementNS(svgNS, "rect")
    rect.setAttribute("x", "0")
    rect.setAttribute("y", "0")
    rect.setAttribute("width", "16")
    rect.setAttribute("height", "16")
    rect.style.fillOpacity = "0"
    rect.style.strokeOpacity = "0"
    rect.onpointerdown = props?.onpointerdown ?? null
    rect.onpointerup = props?.onpointerup ?? null
    rect.onclick = props?.onclick ?? null

    return (
        <svg ref={props?.ref}
            style={{
                width: 16,
                height: 16,
                transform: props?.rotate ? `rotate(${props.rotate}deg)` : undefined
            }}>
            <path stroke="currentcolor" stroke-width={1} fill="none" d="M 5 3 l 5 5 l -5 5" />
            {rect}
            {/* <rect x="0" y="0" width="16" height="16" stroke="currentcolor" fill="none"/> */}
        </svg>
    )
}

function node2html(
    node: IndyNode | undefined,
    map: Map<IndyNode, HTMLElement>,
    listSelection: ListSelection<IndyNode>,
    currentPropertyTab: OptionModel<PropertyTab>,
    depth = 0
): JSX.Element | undefined {
    if (node === undefined) { return }
    let name = node.constructor.name
    let icon: JSX.Element = <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>


    let propertyTab: PropertyTab | undefined

    if (node instanceof Root) {
        name = "Crate"
        icon = <svg width="17" height="16"><use href="icons.svg#blender-collection" /></svg>
    }
    if (node instanceof XForm) {
        propertyTab = PropertyTab.OBJECT
        if (node.objectName) {
            name = node.objectName
        }
        icon = <svg width="16" height="16" style={{ color: "#bd7f4d" }}><use href="icons.svg#blender-outliner-obj-data" /></svg>
    }
    if (node instanceof Mesh) {
        propertyTab = PropertyTab.DATA
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
        const element = node2html(child, map, listSelection, currentPropertyTab, depth + 1)
        if (element) {
            children.push(element)
        }
    }

    let result: JSX.Element, item!: HTMLElement, indent!: HTMLElement, chevron!: SVGElement
    if (children.length) {
        result = <>
            <div ref={item} class="item" tabIndex={0} style={{ "padding-left": `${depth * 20}px` }}>
                <OutlineChevron ref={chevron} rotate={90}
                    onpointerdown={(ev) => ev.stopPropagation()}
                    onpointerup={(ev) => ev.stopPropagation()}
                    onclick={(ev) => {
                        // TODO: persist state in the node
                        if (chevron.style.transform !== "") {
                            chevron.style.transform = ""
                            indent.style.display = "none"
                        } else {
                            chevron.style.transform = "rotate(90deg)"
                            indent.style.display = ""
                        }
                        ev.stopPropagation()
                    }} />
                {icon}{name}
            </div>
            <div ref={indent} class="indent">{...children}</div>
        </>
    } else {
        result = <div ref={item} class="item" tabIndex={0} style={{ "padding-left": `${depth * 20 + 12}px` }}>{icon}{name}</div>
    }
    map.set(node, item)
    // let inside = false
    // item.onpointerleave = () => { inside = false }
    // item.onpointerenter = () => { inside = true }

    // prevent context menu so we can use ctrl + pointer button
    item.oncontextmenu = (ev: PointerEvent) => {
        ev.preventDefault()
    }
    item.onpointerdown = (ev: PointerEvent) => {
        ev.preventDefault()
    }
    item.onclick = (ev: PointerEvent) => {
        ev.preventDefault()
        const xform = node?.getXForm()!
        if (ev.shiftKey) { // this is Ctrl in blender
            listSelection.add(node, xform)
            node.context.selection.add(node)
        } else {
            listSelection.set(node, xform)
            node.context.selection.set(node)
        }
        node.context.invalidate()
        // console.log(`set focus to ${node.constructor.name}`)
        if (propertyTab) {
            currentPropertyTab.value = propertyTab
        }
        item.focus()
    }
    return result
}

/**
 * Display data of current file.
 */
export function Outliner(props: OutlinerProps) {

    const outliner = <div class="outliner" ref={props.ref} /> as HTMLElement

    // FIXME: seting the background via style={{backgroundImage: encodeURIComponent(backgroundImage)}} ain't working
    const barHeight = 22
    let backgroundImage = `<svg xmlns="http://www.w3.org/2000/svg" class="outliner-bar" viewBox="0 0 40 ${2 * barHeight}">`
        + `<rect x="0" y="0" width="40" height="${barHeight}" fill="rgba(0,0,0,0)" stroke="none" />`
        + `<rect x="0" y="${barHeight}" width="40" height="${barHeight}" fill="rgba(255,255,255,0.1)" stroke="none" />`
        + `</svg>`
    outliner.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(backgroundImage)}")`

    let node2element: Map<IndyNode, HTMLElement>
    let listSelection = new ListSelection<IndyNode>()

    const updateFromSelection = () => {
        // console.log(`updateFromSelection: map ${map.entries}`)
        for (const [node, element] of node2element.entries()) {
            element.classList.toggle("selected", listSelection.has(node))

            if (props.objectSelection.isActive(node)) {
                element.classList.add("obj-active")
                element.classList.remove("obj-selected")
            } else if (props.objectSelection.isSelected(node)) {
                element.classList.remove("obj-active")
                element.classList.add("obj-selected")
            } else {
                element.classList.remove("obj-active", "obj-selected")
            }
        }
    }

    const updateFromModel = () => {
        // console.log(`Outliner: node tree changed`)
        node2element = new Map()
        const children = node2html(props.nodeTree.root, node2element, listSelection, props.propertyTab)
        // console.log(children)
        replaceChildren(outliner, children)
        updateFromSelection()
    }

    props.nodeTree.signal.add(updateFromModel)
    props.objectSelection.signal.add(updateFromSelection)
    listSelection.signal.add(updateFromSelection)

    updateFromModel()
    updateFromSelection()

    return outliner
}
