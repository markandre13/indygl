import { describe, expect, it } from 'vitest'
import { fit, xit } from '../../spec'
import { type MeshData } from 'src/Mesh'
import { vec3 } from 'gl-matrix'
import { deg2rad } from 'src/gl/algorithms/deg2rad'
import { euler2matrix } from 'src/gl/algorithms/euler'
import { triangulate } from 'src/gl/algorithms/triangulate'

describe("triangulate", () => {
    it("3-gon (triangle)", () => {
        const mesh: MeshData = {
            xyz: [-1, 1, 0, 1, 1, 0, 1, -1, 0,],
            fxyz: [0, 1, 2],
            fuv: [3, 4, 5],
            fnormal: [6, 7, 8],
            vcount: [3]
        }
        expect(triangulate(mesh).fxyz).to.be.deep.equal([0, 1, 2])
        expect(triangulate(mesh).fuv).to.be.deep.equal([3, 4, 5])
        expect(triangulate(mesh).fnormal).to.be.deep.equal([6, 7, 8])
    })
    it("4-gon (quad)", () => {
        const mesh: MeshData = {
            xyz: [-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, -1, 0],
            fxyz: [0, 1, 2, 3],
            fuv: [4, 5, 6, 7],
            fnormal: [8, 9, 10, 11],
            vcount: [4]
        }
        expect(triangulate(mesh).fxyz).to.be.deep.equal([0, 1, 2, 2, 3, 0])
        expect(triangulate(mesh).fuv).to.be.deep.equal([4, 5, 6, 6, 7, 4])
        expect(triangulate(mesh).fnormal).to.be.deep.equal([8, 9, 10, 10, 11, 8])
    })
    describe("5-gon", () => {
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
        ])("rotated by (%i, %i, %i)", (rx: number, ry: number, rz: number) => {
            const xyzFlat = [
                -1, 1, 0,
                1, 1, 0,
                2, 0, 0,
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
            const mesh: MeshData = {
                xyz,
                fxyz: [0, 1, 2, 3, 4],
                fuv: [5, 6, 7, 8, 9],
                fnormal: [10, 11, 12, 13, 14],
                vcount: [5]
            }
            expect(triangulate(mesh).fxyz).to.be.deep.oneOf([
                [3, 4, 0, 0, 1, 2, 2, 3, 0],
                [4, 1, 2, 2, 3, 4, 4, 0, 1]
            ])
            expect(triangulate(mesh).fuv).to.be.deep.oneOf([
                [8, 9, 5, 5, 6, 7, 7, 8, 5],
                [9, 6, 7, 7, 8, 9, 9, 5, 6]
            ])
            expect(triangulate(mesh).fnormal).to.be.deep.oneOf([
                [13, 14, 10, 10, 11, 12, 12, 13, 10],
                [14, 11, 12, 12, 13, 14, 14, 10, 11]
            ])
        })
    })
})