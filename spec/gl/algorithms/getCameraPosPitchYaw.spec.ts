import { describe, expect, it, chai } from 'vitest'
import { deg2rad } from 'src/gl/algorithms/deg2rad'
import chaiAlmost from 'chai-almost'
import { toCam } from 'src/gl/algorithms/toCam'
import { getCameraPosPitchYaw, type PPY } from 'src/gl/algorithms/getCameraPosPitchYaw'
import { mat4, vec3 } from 'gl-matrix'

chai.use(chaiAlmost())

describe("getCameraPosPitchYaw", () => {
    it("verify (0, 0, 0),   0,   0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: 0,
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0),  45,   0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0), -45,   0", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: 0
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0),   0, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(0),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0),   0,  45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(0),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0),  45, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0),  45,  45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(45),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0), -45, -45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: deg2rad(-45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("verify (0, 0, 0), -45,  45", () => {
        const input: PPY = {
            pos: vec3.create(),
            pitch: deg2rad(-45),
            yaw: deg2rad(45)
        }
        const camera = toCam(input)
        const output = getCameraPosPitchYaw(camera)
        expect(output).to.deep.almost.equal(input)
    })

    it("avoid pitch >=  90 degree", () => {
        const camera = mat4.fromValues(
            -0.3059198558330536, 0.02437792345881462, -0.9517451524734497, 0,
            8.368257198299034e-9, 0.9996721148490906, 0.02560553513467312, 0,
            0.9520572423934937, 0.007833240553736687, -0.3058195412158966, 0,
            -2.5034677982330322, -17.738000869750977, -53.25141143798828, 1
        )
        const output = getCameraPosPitchYaw(camera)

        expect(output).to.deep.almost.equal({
            pos: vec3.fromValues(-51.01521301269531, 19.095714569091797, -13.762931823730469),
            pitch: -0.02560831012058218,
            yaw: 1.8817007729298854
        })
    })

    it("avoid pitch <= -90 degree", () => {
        const camera = mat4.fromValues(
            -0.3872525095939636, -0.2826727032661438, -0.8775714635848999, 0,
            0, 0.9518399834632874, -0.30659520626068115, 0,
            0.921973705291748, -0.11872976273298264, -0.3686024248600006, 0,
            -2.4173598289489746, -2.5254592895507812, -13.932268142700195, 1
        )
        const output = getCameraPosPitchYaw(camera)

        expect(output).to.deep.almost.equal({
            pos: vec3.fromValues(-13.876567840576172, -1.8677332401275635, -3.2065727710723877),
            pitch: 0.3116138977480478,
            yaw: 1.9684460341038013
        })
    })
})
