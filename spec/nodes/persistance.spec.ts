import { type ObjectSelectionAPI } from "src/gl/ObjectSelection"
import { XForm } from "src/nodes/XForm"
import { describe, expect, it } from "vitest"
import { IndyNode, Root } from "src/nodes/IndyNode"
import { Mesh } from "src/nodes/Mesh"
import { mat4, vec3 } from "gl-matrix"
import { Material } from "src/nodes/Material"
import { deg2rad } from "src/gl/algorithms/deg2rad"
import { persist, restore } from "src/nodes/persistance"
import { xit } from "../spec"
import { BlendShapeGroup } from "src/nodes/BlendShapeGroup"
import { BlendShape } from "src/nodes/BlendShape"

describe("IndyNode", () => {
    it("persist", () => {
        // GIVEN
        const scene = loadDemoScene()
        const selection: ObjectSelectionAPI = {
            active: scene.children[1],
            selected: new Set<IndyNode>([scene.children[1], scene.children[3]])
        }

        // WHEN
        const out = persist(scene, selection)
        // console.log(JSON.stringify(out, undefined, 4))

        // THEN
        expect(out).to.deep.equal(expected)
    })

    it("restore", () => {
        // GIVEN
        const selection: ObjectSelectionAPI = {
            active: undefined,
            selected: new Set<IndyNode>()
        }

        // WHEN
        const scene = restore(expected, selection) as Root

        const out = persist(scene, selection)
        // console.log(JSON.stringify(out, undefined, 4))

        // THEN
        expect(out).to.deep.equal(expected)
        // console.log(root)
    })

    const expected = {
        "name": "Root",
        "#type": "Root",
        "#children": [{
            "name": "Utah Teapot",
            "#type": "XForm",
            "transform": [
                0.5416752099990845, 0.7892866134643555, -0.28916189074516296, 0,
                -0.45451948046684265, 0.5643914937973022, 0.6891112327575684, 0,
                0.7071067690849304, -0.2418447732925415, 0.6644630432128906, 0,
                3, 5, -7, 1
            ],
            "#children": [{
                "name": "Utah Teapot",
                "#type": "Mesh",
                "filename": "obj/utah_teapot.obj",
                "material": "/Root/Material"
            }]
        }, {
            "name": "Material",
            "#type": "Material",
            "selected": true,
            "active": true,
            "rgba": [1, 0.5, 0, 1]
        }, {
            "name": "Dodecahedron",
            "#type": "XForm",
            "transform": [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                3.1500000953674316, 3.4000000953674316, 0, 1
            ],
            "#children": [{
                "name": "Dodecahedron",
                "#type": "Mesh",
                "filename": "obj/dodecahedron.obj",
                "material": "/Root/Material#1"
            }]
        }, {
            "name": "Material#1",
            "#type": "Material",
            "selected": true,
            "rgba": [0, 1, 0, 1]
        }, {
            "name": "Cube",
            "#type": "XForm",
            "transform": [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                2, 1, 4, 1
            ],
            "#children": [{
                "name": "Cube",
                "#type": "Mesh",
                "filename": "obj/mh/cube.obj",
                "material": "/Root/Material#2"
            }]
        }, {
            "name": "Material#2",
            "#type": "Material",
            "rgba": [0, 0.2, 1, 1]
        }, {
            "name": "Human",
            "#type": "XForm",
            "transform": [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                3, 8.050000190734863, -7, 1
            ],
            "#children": [{
                "name": "Human",
                "#type": "Mesh",
                "filename": "obj/mh/base.obj",
                "material": "/Root/Material#3",
                "#children": [{
                    "name": "BlendShapeGroup",
                    "#type": "BlendShapeGroup",
                    "transform": [
                        10.257156372070312, 0, 0, 0,
                        0, 10.257156372070312, 0, 0,
                        0, 0, 10.257156372070312, 0,
                        0, 7.028500080108643, 0.9556999802589417, 1
                    ],
                    "#children": [{
                        "name": "Neutral",
                        "#type": "BlendShape",
                        "filename": "obj/arkit/Neutral.obj"
                    }]
                }]
            }]
        }, {
            "name": "Material#3",
            "#type": "Material",
            "texture": "img/young_caucasian_female_special_suit.jpg"
        }]
    }
})

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

    const blendshapeGroup = new BlendShapeGroup(humanMesh)
    const s = 10.257156372070312
    blendshapeGroup.transform = mat4.create()
    mat4.translate(blendshapeGroup.transform, blendshapeGroup.transform, vec3.fromValues(0, 7.0285, 0.9557))
    mat4.scale(blendshapeGroup.transform, blendshapeGroup.transform, vec3.fromValues(s, s, s))

    const key0 = new BlendShape(blendshapeGroup, "Neutral", "obj/arkit/Neutral.obj")

    return root
}