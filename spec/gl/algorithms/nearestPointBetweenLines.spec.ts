import { describe, it, expect } from "vitest"
import { vec3 } from "gl-matrix"
import { nearestPointBetweenLines } from "../../../src/gl/algorithms/nearestPointBetweenLines"

describe("nearestPointBetweenLines", () => {
    it("should find nearest points on two intersecting lines", () => {
        // Lines that intersect at origin
        const originA = vec3.fromValues(0, 0, 0)
        const directionA = vec3.fromValues(1, 0, 0)
        const originB = vec3.fromValues(0, 0, 0)
        const directionB = vec3.fromValues(0, 1, 0)
        
        const result = nearestPointBetweenLines(originA, directionA, originB, directionB)
        
        // Should be at the intersection point (origin)
        expect(result.distance).toBeCloseTo(0, 1e-6)
        expect(result.a).toBeCloseTo(0, 1e-6)
        expect(result.b).toBeCloseTo(0, 1e-6)
    })
    
    it("should find nearest points on two parallel lines", () => {
        // Parallel lines in x-direction, separated by 2 units in y
        const originA = vec3.fromValues(0, 0, 0)
        const directionA = vec3.fromValues(1, 0, 0)
        const originB = vec3.fromValues(0, 2, 0)
        const directionB = vec3.fromValues(1, 0, 0)
        
        const result = nearestPointBetweenLines(originA, directionA, originB, directionB)
        
        // Distance should be 2 (separation in y-direction)
        expect(result.distance).toBeCloseTo(2, 1e-6)
        // Both lines are in x-direction, so closest points should be at y=0
        expect(result.a).toBeCloseTo(0, 1e-6)
        expect(result.b).toBeCloseTo(0, 1e-6)
    })
    
    it("should find nearest points on two skew lines", () => {
        // Lines in 3D space that are neither parallel nor intersecting
        const originA = vec3.fromValues(0, 0, 0)
        const directionA = vec3.fromValues(1, 0, 0)
        const originB = vec3.fromValues(0, 1, 0)
        const directionB = vec3.fromValues(0, 0, 1)
        
        const result = nearestPointBetweenLines(originA, directionA, originB, directionB)
        
        // Distance should be 1 (minimum distance between skew lines)
        expect(result.distance).toBeCloseTo(1, 1e-6)
    })
    
    it("should find nearest points on two lines with different directions", () => {
        // Lines in 3D space
        const originA = vec3.fromValues(1, 2, 3)
        const directionA = vec3.fromValues(1, 1, 0)
        const originB = vec3.fromValues(4, 5, 6)
        const directionB = vec3.fromValues(0, 1, 1)
        
        const result = nearestPointBetweenLines(originA, directionA, originB, directionB)
        
        // Should find a valid minimum distance
        expect(result.distance).toBeGreaterThanOrEqual(0)
    })
    
    it("should handle degenerate cases with zero vectors", () => {
        const originA = vec3.fromValues(0, 0, 0)
        const directionA = vec3.fromValues(0, 0, 0) // Zero vector
        const originB = vec3.fromValues(1, 1, 1)
        const directionB = vec3.fromValues(1, 0, 0)
        
        const result = nearestPointBetweenLines(originA, directionA, originB, directionB)
        
        // Should handle gracefully
        expect(result.distance).toBeGreaterThanOrEqual(0)
    })
})