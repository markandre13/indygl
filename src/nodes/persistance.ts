import type { ObjectSelectionAPI } from "src/gl/ObjectSelection"
import { Root, type IndyNode } from "./IndyNode"
import { Material } from "./Material"
import { Mesh } from "./Mesh"
import { XForm } from "./XForm"
import { mat4 } from "gl-matrix"
import { BlendShapeGroup } from "./BlendShapeGroup"
import { BlendShape } from "./BlendShape"

export function persist(root: Root, selection: ObjectSelectionAPI) {
    const node2name = new Map<IndyNode, string>()
    makenames(root, node2name)
    return encode(root, selection, node2name)
}

export function restore(data: any, selection: ObjectSelectionAPI) {
    const name2node = new Map()
    const root = decode(data, selection, undefined, name2node)!
    setReferences(data, name2node)
    return root
}

function setReferences(data: any, name2node: Map<string, IndyNode>, path: string = "/") {
    const type = data["#type"]
    const children = data["#children"] ?? []

    path = path + data.name
    const node = name2node.get(path) as any
    path += '/'
    switch (node.constructor.name) {
        case "Mesh":
            node.material = name2node.get(data.material) as any
        // console.log(data.material)
    }
    for (const child of children) {
        setReferences(child, name2node, path)
    }
}

function decode(data: any, selection: ObjectSelectionAPI, parent: IndyNode | undefined, name2node: Map<string, IndyNode>, path: string = "/"): IndyNode | undefined {
    const type = data["#type"]
    const children = data["#children"] ?? []
    let node: IndyNode | undefined
    switch (type) {
        case "Root":
            node = new Root()
            break
        case "XForm":
            node = new XForm(parent!!, data.name)
            if (data.transform) {
                const t = data.transform as number[]
                (node as XForm).transform = mat4.fromValues(
                    t[0], t[1], t[2], t[3],
                    t[4], t[5], t[6], t[7],
                    t[8], t[9], t[10], t[11],
                    t[12], t[13], t[14], t[15]
                )
            }
            break
        case "Mesh":
            node = new Mesh(parent as any, data.filename)
            node.name = data.name
            break
        case "Material":
            node = new Material(parent as any, data.rgba ? data.rgba : data.texture)
            node.name = data.name
            break
        case "BlendShapeGroup":
            node = new BlendShapeGroup(parent as any)
            if (data.transform) {
                const t = data.transform as number[]
                (node as XForm).transform = mat4.fromValues(
                    t[0], t[1], t[2], t[3],
                    t[4], t[5], t[6], t[7],
                    t[8], t[9], t[10], t[11],
                    t[12], t[13], t[14], t[15]
                )
            }
            break
        case "BlendShape":
            node = new BlendShape(parent as any, "", "");
            (node as BlendShape).restore(data)
            break
        default:
            throw Error(`restore: unknown node type '${type}'`)
    }
    path = path + data.name
    name2node.set(path, node)
    path += '/'

    if (data.active === true) {
        selection.active = node
    }
    if (data.selected === true) {
        selection.selected.add(node as any)
    }
    for (const child of children) {
        decode(child, selection, node, name2node, path)
    }
    return node
}


/**
 * make a unique names for all nodes
 * 
 * * uses USD alike path names <root name>/<child name>/...
 * * appends #<number>
 * 
 */
function makenames(node: IndyNode, node2name: Map<IndyNode, string>, usedNames = new Set<string>(), path: string = "/") {
    // make node.name unique within it's parent
    while (usedNames.has(path + node.name)) {
        const s = node.name.split("#")
        if (s.length === 1) {
            node.name = s[0] + "#1"
        } else {
            node.name = s[0] + '#' + (parseInt(s[1]) + 1)
        }
    }
    path += node.name
    usedNames.add(path)

    node2name.set(node, path)
    path += "/"
    for (const child of node.children) {
        makenames(child, node2name, usedNames, path)
    }
}

// NOTE: we need links! try usd style pathnames
function encode(node: IndyNode, selection: ObjectSelectionAPI, node2name: Map<IndyNode, string>) {
    const data = {} as any
    data.name = node.name
    data["#type"] = node.constructor.name

    if (selection.selected.has(node)) {
        data.selected = true
    }
    if (selection.active === node) {
        data.active = true
    }

    if (node instanceof Mesh) {
        data.filename = node.filename
        if (node.material) {
            data.material = node2name.get(node.material)
        }
    } else if (node instanceof XForm) {
        if (node.transform) {
            data.transform = Array.from(node.transform)
        }
    } else if (node instanceof Material) {
        node.persist(data)
    } else if (node instanceof BlendShapeGroup) {
        if (node.transform) {
            data.transform = Array.from(node.transform)
        }
    } else if (node instanceof BlendShape) {
        node.persist(data)
    }
    const children: any[] = []
    for (const child of node.children) {
        children.push(encode(child, selection, node2name))
    }
    if (children.length > 0) {
        data["#children"] = children
    }
    return data
}
