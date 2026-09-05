import type { ObjectSelection } from "src/gl/ObjectSelection"
import { NODE_CHANGE, type IndyNode, type NodeChangeEvent, type NodeEvent, type Root } from "src/nodes/IndyNode"
import { Model } from "toad.js/appkit/Model"
import type { OptionModel } from "toad.js/appkit/OptionModel"
import { makeRef, Reference, replaceChildren, type HTMLElementProps, type JSX } from "toad.jsx/jsx-runtime"
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
    root: Root
    objectSelection: ObjectSelection
    propertyTab: OptionModel<PropertyTab>
}

// const selection = new ValueModel<ShapeKey | null>(null)

export function OutlineChevron(props?: {
    rotate?: number,
    onpointerdown?: (ev: PointerEvent) => void,
    onpointerup?: (ev: PointerEvent) => void,
    onclick?: (ev: PointerEvent) => void,
    ref?: JSX.Ref
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
    node2update: Map<IndyNode, (ev: NodeEvent) => void>,
    listSelection: ListSelection<IndyNode>,
    objectSelection: ObjectSelection,
    currentPropertyTab: OptionModel<PropertyTab>,
    depth = 0
): JSX.Element | undefined {
    if (node === undefined) { return }
    let name = node.constructor.name
    let icon: JSX.Element = <svg width="16" height="16" style={{ color: "#ab5a61" }}><use href="icons.svg#blender-material-data" /></svg>

    let propertyTab: PropertyTab | undefined

    name = node.name
    icon = <svg width="16" height="16" style={{ color: node.uihints.color }}><use href={node.uihints.icon} /></svg>
    propertyTab = node.uihints.propertyTab

    // console.log(`${"    ".repeat(depth)}${name}`)

    const children: JSX.Element[] = []
    for (let child of node.children) {
        const element = node2html(child, node2update, listSelection, objectSelection, currentPropertyTab, depth + 1)
        if (element) {
            children.push(element)
        }
    }

    // TODO: break this up into more compomnents? or views and models? other?
    let result: JSX.Element, item = makeRef<HTMLDivElement>(), indent = makeRef(), chevron = makeRef(), toggles = makeRef()
    let toggleHideSvg = makeRef()

    // console.log(`node '${node.name}', show=${node.show ? "on" : "off"}`)

    const nested = <>{icon}{name}
        <div ref={toggles} class="toggles">
            <div
                title="Hide in Viewport"
                onpointerdown={(ev) => {
                    ev.preventDefault()
                    if (node.showEnabled) {
                        console.log(`toggle node(${node.constructor.name} ${node.name}) to ${!node.show}`)
                        node.show = !node.show
                    }
                }}
            >
                <svg ref={toggleHideSvg} width="16" height="16" />
            </div>
        </div>
    </>

    if (children.length) {
        result = <>
            <div ref={item}
                class="item"
                tabIndex={0} style={{ "padding-left": `${depth * 20}px` }}>
                <OutlineChevron ref={chevron} rotate={90}
                    onpointerdown={(ev) => ev.stopPropagation()}
                    onpointerup={(ev) => ev.stopPropagation()}
                    onclick={(ev) => {
                        // TODO: persist state in the node
                        if (chevron.current.style.transform !== "") {
                            chevron.current.style.transform = ""
                            indent.current.style.display = "none"
                        } else {
                            chevron.current.style.transform = "rotate(90deg)"
                            indent.current.style.display = ""
                        }
                        ev.stopPropagation()
                    }} />
                {nested}
            </div>
            <div ref={indent} class="indent">{...children}</div>
        </>
    } else {
        result = <div ref={item}
            class="item"
            tabIndex={0} style={{ "padding-left": `${depth * 20 + 12}px` }}>
            {nested}
        </div>
    }

    // note: this function uses toggleHideSvg
    function updateNode(ev: NodeEvent) {
        // if (ev.type !== NODE_CHANGE) {
        //     return
        // }
        const node = ev.node
        // console.log(`${ev.type.description} ${node.constructor.name}(${node.name})`)

        const show = ev.node.show
        const showEnabled = ev.node.showEnabled
        // console.log(`  UPDATE: ${ev.type.description} ${node.constructor.name}(${node.name}): show=${show} showEnabled=${showEnabled}`)

        if (objectSelection.isActive(node)) {
            // console.log(`  is active`)
            item.current.classList.add("obj-active")
            item.current.classList.remove("obj-selected")
        } else if (objectSelection.isSelected(node)) {
            // console.log(`  is selected`)
            item.current.classList.remove("obj-active")
            item.current.classList.add("obj-selected")
        } else {
            // console.log(`  is neither active nor selected`)
            item.current.classList.remove("obj-active", "obj-selected")
        }

        switch (show) {
            case true:
                if (showEnabled) {
                    replaceChildren(toggleHideSvg, <use href="icons.svg#blender-hide-off" style="color: #fff;" />)
                } else {
                    replaceChildren(toggleHideSvg, <use href="icons.svg#blender-hide-off" style="color: #888;" />)
                }
                break
            case false:
                if (showEnabled) {
                    replaceChildren(toggleHideSvg, <use href="icons.svg#blender-hide-on" style="color: #fff;" />)
                } else {
                    replaceChildren(toggleHideSvg, <use href="icons.svg#blender-hide-on" style="color: #888;" />)
                }
                break
            case undefined:
                replaceChildren(toggleHideSvg, undefined)
                break
        }
    }
    updateNode({ type: NODE_CHANGE, node })
    node2update.set(node, updateNode)

    // prevent context menu so we can use ctrl + pointer button
    item.current.oncontextmenu = (ev: PointerEvent) => ev.preventDefault()
    item.current.onpointerdown = (ev: PointerEvent) => ev.preventDefault()
    item.current.onclick = (ev: PointerEvent) => {
        // if in chevron, do nothing here
        if (chevron.current && (
            chevron.current.contains(ev.target as Node) || toggles.current.contains(ev.target as Node))) {
            return
        }

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
        item.current.focus()
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

    let node2update = new Map<IndyNode, (ev: NodeEvent) => void>()
    let listSelection = new ListSelection<IndyNode>()

    const children = node2html(props.root.root, node2update, listSelection, props.objectSelection, props.propertyTab)
    replaceChildren(outliner, children)

    // props.root.signal.add(updateFromModel)
    // props.objectSelection.signal.add(updateFromSelection)
    // listSelection.signal.add(updateFromSelection)
    // console.log(props.nodeTree.root)
    // handler = new Map()
    props.root.signal.add((ev: NodeEvent) => {
        node2update.get(ev.node)?.(ev)
    })
    props.objectSelection.signal.add((changedNodes) => {
        // console.log(`object selection changed for ${changedNodes.size} nodes`)
        for (let node of changedNodes) {
            // console.log(`  update node ${node.constructor.name}(${node.name})`)
            const ev: NodeChangeEvent = { type: NODE_CHANGE, node }
            const update = node2update.get(node)
            if (update !== undefined) {
                update(ev)
            } else {
                console.log("oops")
            }
        }
    })

    // updateFromModel()
    // updateFromSelection()

    return outliner
}
