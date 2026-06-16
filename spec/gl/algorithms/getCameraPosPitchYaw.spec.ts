import { describe, expect, it, chai } from 'vitest'
import { deg2rad } from 'src/gl/algorithms/deg2rad'
import chaiAlmost from 'chai-almost'
import { toCam } from 'src/gl/algorithms/toCam'
import { getCameraPosPitchYaw, type PPY } from 'src/gl/algorithms/getCameraPosPitchYaw'
import { vec3 } from 'gl-matrix'

chai.use(chaiAlmost())

describe("getCameraPosPitchYaw", () => {
    it("regression (0,0,0), 0, 0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: 0,
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0), 45, 0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0), -45, 0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  0, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(0),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  0, 45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(0),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  45, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  45, 45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  -45, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("regression (0,0,0),  -45, 45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

})
