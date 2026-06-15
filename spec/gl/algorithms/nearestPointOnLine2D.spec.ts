import { describe, it, expect } from "vitest"
import { nearestPointOnLine2D } from "src/gl/algorithms/nearestPointOnLine2D"

describe("nearestPointOnLine2D", () => {
    it("should find the nearest point on a line to a given point", () => {
        // Line: origin = (0, 0), direction = (1, 0) -> x-axis
        // Point: (2, 3)
        const point = { x: 2, y: 3 }
        const origin = { x: 0, y: 0 }
        const direction = { x: 1, y: 0 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The nearest point should be (2, 0) on the x-axis
        expect(result.p.x).toBeCloseTo(2, 1e-6)
        expect(result.p.y).toBeCloseTo(0, 1e-6)
        // The parameter a should be 2 (since (0,0) + 2*(1,0) = (2,0))
        expect(result.a).toBeCloseTo(2, 1e-6)
    })
    
    it("should find the nearest point when point is on the line", () => {
        // Line: origin = (0, 0), direction = (1, 1) -> y=x line
        // Point: (2, 2) - on the line
        const point = { x: 2, y: 2 }
        const origin = { x: 0, y: 0 }
        const direction = { x: 1, y: 1 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The nearest point should be (2, 2) itself
        expect(result.p.x).toBeCloseTo(2, 1e-6)
        expect(result.p.y).toBeCloseTo(2, 1e-6)
        // The parameter a should be 2 (since (0,0) + 2*(1,1) = (2,2))
        expect(result.a).toBeCloseTo(2, 1e-6)
    })
    
    it("should find the nearest point when point is at origin", () => {
        // Line: origin = (1, 1), direction = (1, 0) -> horizontal line offset
        // Point: (1, 1) - at the origin of the line
        const point = { x: 1, y: 1 }
        const origin = { x: 1, y: 1 }
        const direction = { x: 1, y: 0 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The nearest point should be (1, 1) itself
        expect(result.p.x).toBeCloseTo(1, 1e-6)
        expect(result.p.y).toBeCloseTo(1, 1e-6)
        // The parameter a should be 0 (since (1,1) + 0*(1,0) = (1,1))
        expect(result.a).toBeCloseTo(0, 1e-6)
    })
    
    it("should handle vertical line correctly", () => {
        // Line: origin = (0, 0), direction = (0, 1) -> y-axis
        // Point: (2, 3)
        const point = { x: 2, y: 3 }
        const origin = { x: 0, y: 0 }
        const direction = { x: 0, y: 1 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The nearest point should be (0, 3) on the y-axis
        expect(result.p.x).toBeCloseTo(0, 1e-6)
        expect(result.p.y).toBeCloseTo(3, 1e-6)
        // The parameter a should be 3 (since (0,0) + 3*(0,1) = (0,3))
        expect(result.a).toBeCloseTo(3, 1e-6)
    })
    
    it("should handle degenerate case with zero direction vector", () => {
        // Line: origin = (2, 3), direction = (0, 0) -> degenerate case
        // Point: (5, 7)
        const point = { x: 5, y: 7 }
        const origin = { x: 2, y: 3 }
        const direction = { x: 0, y: 0 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // Should return the origin as the nearest point
        expect(result.p.x).toBeCloseTo(2, 1e-6)
        expect(result.p.y).toBeCloseTo(3, 1e-6)
        // The parameter a should be 0
        expect(result.a).toBeCloseTo(0, 1e-6)
    })
    
    it("should find the nearest point on a diagonal line", () => {
        // Line: origin = (0, 0), direction = (1, 1) -> y=x line
        // Point: (3, 1)
        const point = { x: 3, y: 1 }
        const origin = { x: 0, y: 0 }
        const direction = { x: 1, y: 1 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The nearest point should be (2, 2) on the y=x line
        // This is calculated as: a = ((3-0)*1 + (1-0)*1) / (1*1 + 1*1) = 4/2 = 2
        // So point = (0,0) + 2*(1,1) = (2,2)
        expect(result.p.x).toBeCloseTo(2, 1e-6)
        expect(result.p.y).toBeCloseTo(2, 1e-6)
        expect(result.a).toBeCloseTo(2, 1e-6)
    })
    
    it("should find the nearest point on a line with negative direction", () => {
        // Line: origin = (0, 0), direction = (-1, 2) 
        // Point: (3, 4)
        const point = { x: 3, y: 4 }
        const origin = { x: 0, y: 0 }
        const direction = { x: -1, y: 2 }
        
        const result = nearestPointOnLine2D(point, origin, direction)
        
        // The parameter a should be calculated as:
        // a = ((3-0)*(-1) + (4-0)*2) / ((-1)*(-1) + 2*2) = (-3 + 8) / (1 + 4) = 5/5 = 1
        // So point = (0,0) + 1*(-1,2) = (-1, 2)
        expect(result.a).toBeCloseTo(1, 1e-6)
        expect(result.p.x).toBeCloseTo(-1, 1e-6)
        expect(result.p.y).toBeCloseTo(2, 1e-6)
    })
})