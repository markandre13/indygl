import { describe, expect, it } from 'vitest'
import { fit, xit } from './spec'
import { Mesh } from 'src/Mesh'
import { mat4, vec3 } from 'gl-matrix'
import { deg2rad } from 'src/gl/algorithms/deg2rad'
import { euler2matrix, matrix2euler } from 'src/gl/algorithms/euler'
import { isZero } from 'src/gl/algorithms/isZero'

describe("triangulate", () => {
    it.each([
        [0, 0, 0],
        [90, 0, 0],
        [180, 0, 0],
        [270, 0, 0],
        [0, 90, 0],
        [0, 180, 0],
        [0, 270, 0],
        [0, 0, 90],
        [0, 0, 180],
        [0, 0, 270],
        [90, 90, 0],
        [90, 180, 0],
        [90, 270, 0],
        [180, 90, 0],
        [180, 180, 0],
        [180, 270, 0],
        [270, 90, 0],
        [270, 180, 0],
        [270, 270, 0],
    ])("square rotated by (%i, %i, %i)", (rx: number, ry: number, rz: number) => {

        const xyzFlat = [
            -1, 1, 0,
            1, 1, 0,
            1, -1, 0,
            -1, -1, 0
        ]
        const m = euler2matrix(deg2rad(rx), deg2rad(ry), deg2rad(rz))

        const v = vec3.create()
        const xyz: number[] = []
        for (let i = 0; i < xyzFlat.length;) {
            vec3.set(v, xyzFlat[i++], xyzFlat[i++], xyzFlat[i++])
            vec3.transformMat4(v, v, m)
            xyz.push(v[0], v[1], v[2])
        }

        const mesh = new Mesh(undefined as any, {
            xyz,
            fxyz: [0, 1, 2, 3],
            vcount: [4]
        })

        // console.log(JSON.stringify(mesh.triangulate()))

        expect(mesh.triangulate()).to.be.deep.oneOf([
            [1, 2, 3, 3, 0, 1],
            [2, 3, 0, 0, 1, 2]
        ])
    })
})