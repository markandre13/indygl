import { EditorModel } from "src/editor/app/EditorModel"
import { ObjectSelection } from "src/gl/ObjectSelection"
import { XForm } from "src/nodes/XForm"
import { describe, expect, it } from "vitest"
import { IndyNode, NODE_CHANGE, NODE_INSERT, Root, type NodeEvent } from "src/nodes/IndyNode"
import { Mesh } from "src/nodes/Mesh"
import { mat4, vec3 } from "gl-matrix"
import { Material } from "src/nodes/Material"
import { deg2rad } from "src/gl/algorithms/deg2rad"

describe("IndyNode", () => {
    it("persist", () => {
        const scene = loadDemoScene()
        // const selection = new ObjectSelection()
        persist(scene)
    })
})

function persist(root: Root) {
    const node2name = new Map<IndyNode, string>()
    makenames(root, node2name)

    console.log(JSON.stringify(encode(root, node2name), undefined, 4))
}

/**
 * make a unique names for all nodes
 * 
 * * uses USD alike path names <root name>/<child name>/...
 * * appends #<number>
 * 
 */
function makenames(node: IndyNode, node2name: Map<IndyNode, string>, usedNames = new Set<string>(), path: string = "") {
    path += node.name

    while (usedNames.has(path)) {
        const s = path.split("#")
        if (s.length === 1) {
            path += "#1"
        } else {
            path = s[0] + '#' + (parseInt(s[1]) + 1)
        }
    }
    usedNames.add(path)

    node2name.set(node, path)
    path += "/"
    for (const child of node.children) {
        makenames(child, node2name, usedNames, path)
    }
}

// NOTE: we need links! try usd style pathnames
function encode(node: IndyNode, node2name: Map<IndyNode, string>) {
    const data = {} as any
    data.name = node2name.get(node)
    data["#type"] = node.constructor.name
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
    }
    const children: any[] = []
    for (const child of node.children) {
        children.push(encode(child, node2name))
    }
    if (children.length > 0) {
        data["#children"] = children
    }
    return data
}

function restore() {

}

function loadDemoScene(): Root {
    const root = new Root()
    const teapot = new XForm(root)
    const teapotMesh = new Mesh(teapot, "obj/utah_teapot.obj")
    teapot.objectName = teapotMesh.dataName = "Utah Teapot"
    teapotMesh.material = new Material(root, [1, 0.5, 0, 1])
    teapot.transform = mat4.create()
    mat4.translate(teapot.transform, teapot.transform, vec3.fromValues(3, 5, -7))
    mat4.rotateX(teapot.transform, teapot.transform, deg2rad(20))
    mat4.rotateY(teapot.transform, teapot.transform, deg2rad(45))
    mat4.rotateZ(teapot.transform, teapot.transform, deg2rad(40))

    const dodecahedron = new XForm(root)
    const dodecahedronMesh = new Mesh(dodecahedron, "obj/dodecahedron.obj")
    dodecahedron.objectName = dodecahedronMesh.dataName = "Dodecahedron"
    dodecahedronMesh.material = new Material(root, [0, 1, 0, 1])
    dodecahedron.transform = mat4.create()
    mat4.translate(dodecahedron.transform, dodecahedron.transform, vec3.fromValues(3.15, 3.4, 0))

    const cube = new XForm(root)
    const cubeMesh = new Mesh(cube, "obj/mh/cube.obj")
    cube.objectName = cubeMesh.dataName = "Cube"
    cubeMesh.material = new Material(root, [0, 0.2, 1, 1])
    cube.transform = mat4.create()
    mat4.translate(cube.transform, cube.transform, vec3.fromValues(2, 1, 4))

    const human = new XForm(root)
    const humanMesh = new Mesh(human, "obj/mh/base.obj")
    human.objectName = humanMesh.dataName = "Human"
    humanMesh.material = new Material(root, "img/young_caucasian_female_special_suit.jpg")

    human.transform = mat4.create()
    mat4.translate(human.transform, human.transform, vec3.fromValues(3, 8.05, -7))
    return root
}