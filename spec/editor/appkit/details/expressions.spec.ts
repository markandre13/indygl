import { describe, expect, it } from 'vitest'
import { Lexer } from '../../../../src/editor/appkit/details/Lexer'
import { fit, xit } from '../../../spec'
import { evaluate, expression } from '../../../../src/editor/appkit/details/expression'
import BigNumber from 'bignumber.js'
import type { ExpressionNode } from '../../../../src/editor/appkit/details/ExpressionNode'
import { Length } from '../../../../src/editor/appkit/units/Length'

function num(node: ExpressionNode | undefined): number {
    if (node?.value instanceof BigNumber) {
        return node?.value.toNumber()
    }
    throw Error(`${node} is not a number`)
}

describe("expressions with units", () => {
    it("1cm", () => {
        expect(evaluate("1cm", Length)?.toNumber()).equals(0.01)
    })
    it("1m + 2cm + 3mm + 4um", () => {
        expect(evaluate("1m + 2cm + 3mm + 4um", Length)?.toNumber()).equals(1.023004)
    })
})

describe("expressions", function () {
    describe("lexer", function () {
        describe("single token", function () {
            it("1", function () {
                const lexer = new Lexer("1")
                const n = lexer.lex()?.value as BigNumber
                expect((n as BigNumber).eq(1)).is.true
            })
            it("1.9", function () {
                const lexer = new Lexer("1.9")
                const n = lexer.lex()?.value as BigNumber
                expect((n as BigNumber).eq(1.9)).is.true
            })
            it("1e9", function () {
                const lexer = new Lexer("1e9")
                const n = lexer.lex()?.value as BigNumber
                expect((n as BigNumber).eq(1e9)).is.true
            })
            it("1E9", function () {
                const lexer = new Lexer("1E9")
                const n = lexer.lex()?.value as BigNumber
                expect((n as BigNumber).eq(1e9)).is.true
            })
            it("+", function () {
                const lexer = new Lexer("+")
                expect(lexer.lex()?.value).to.equal('+')
            })
            it("-", function () {
                const lexer = new Lexer("-")
                expect(lexer.lex()?.value).to.equal('-')
            })
            it("*", function () {
                const lexer = new Lexer("*")
                expect(lexer.lex()?.value).to.equal('*')
            })
            it("/", function () {
                const lexer = new Lexer("/")
                expect(lexer.lex()?.value).to.equal('/')
            })
            it("(", function () {
                const lexer = new Lexer("(")
                expect(lexer.lex()?.value).to.equal('(')
            })
            it(")", function () {
                const lexer = new Lexer(")")
                expect(lexer.lex()?.value).to.equal(')')
            })
            it("text", function () {
                const lexer = new Lexer("cm")
                expect(lexer.lex()?.value).to.equal("cm")
            })
        })
        describe("multiple tokens", function () {
            it("1+2", function () {
                const lexer = new Lexer("1+2")
                const a = lexer.lex()?.value as BigNumber
                expect((a as BigNumber).eq(1)).is.true
                expect(lexer.lex()?.value).to.equal('+')
                const b = lexer.lex()?.value as BigNumber
                expect((b as BigNumber).eq(2)).is.true
                expect(lexer.lex()).to.be.undefined
            })
            it(" 1 + 2 ", function () {
                const lexer = new Lexer(" 1 + 2 ")
                const a = lexer.lex()?.value as BigNumber
                expect((a as BigNumber).eq(1)).is.true
                expect(lexer.lex()?.value).to.equal('+')
                const b = lexer.lex()?.value as BigNumber
                expect((b as BigNumber).eq(2)).is.true
                expect(lexer.lex()).to.be.undefined
            })
            it("1cm", function () {
                const lexer = new Lexer("1cm")
                const a = lexer.lex()?.value as BigNumber
                expect((a as BigNumber).eq(1)).is.true
                expect(lexer.lex()?.value).to.equal('cm')
                expect(lexer.lex()).to.be.undefined
            })
        })
    })
    describe("parse", function () {
        it("1", function () {
            const tree = expression("1")
            expect(num(tree)).to.equal(1)
        })
        fit("1+2", function () {
            const tree = expression("1+2")
            expect(tree?.value).to.equal('+')
            expect(num(tree?.down)).to.equal(1)
            expect(num(tree?.down?.next)).to.equal(2)
        })
        it("1*2", function () {
            const tree = expression("1*2")
            expect(tree?.value).to.equal('*')
            expect(num(tree?.down)).to.equal(1)
            expect(num(tree?.down?.next)).to.equal(2)
        })
        it("1+2*3", function () {
            const tree = expression("1+2*3")
            expect(tree?.value).to.equal('+')
            expect(num(tree?.down)).to.equal(1)
            expect(tree?.down?.next?.value).to.equal('*')
            expect(num(tree?.down?.next?.down)).to.equal(2)
            expect(num(tree?.down?.next?.down?.next)).to.equal(3)
        })
        it("1*2+3", function () {
            const tree = expression("1*2+3")
            expect(tree?.value).to.equal('+')
            expect(tree?.down?.value).to.equal('*')
            expect(num(tree?.down?.down)).to.equal(1)
            expect(num(tree?.down?.down?.next)).to.equal(2)
            expect(num(tree?.down?.next)).to.equal(3)
        })
        it("(1)", function () {
            const tree = expression("(1)")
            expect(num(tree)).to.equal(1)
        })
        it("(1+2)", function () {
            const tree = expression("(1+2)")
            expect(tree?.value).to.equal('+')
            expect(num(tree?.down)).to.equal(1)
            expect(num(tree?.down?.next)).to.equal(2)
        })
        it("((1+2))", function () {
            const tree = expression("((1+2))")
            expect(tree?.value).to.equal('+')
            expect(num(tree?.down)).to.equal(1)
            expect(num(tree?.down?.next)).to.equal(2)
        })
        it("(1+2)*3", function () {
            const tree = expression("(1+2)*3")
            expect(tree?.value).to.equal('*')
            expect(tree?.down?.value).to.equal('+')
            expect(num(tree?.down?.down)).to.equal(1)
            expect(num(tree?.down?.down?.next)).to.equal(2)
            expect(num(tree?.down?.next)).to.equal(3)
        })
        it("-1", function () {
            const tree = expression("-1")
            expect(tree?.value).to.equal('-')
            expect(num(tree?.down)).to.equal(1)
        })
        it("-1", function () {
            const tree = expression("1+-2")
            expect(tree?.value).to.equal('+')
            expect(num(tree?.down)).to.equal(1)
            expect(tree?.down?.next?.value).to.equal('-')
            expect(num(tree?.down?.next?.down)).to.equal(2)
        })
    })
    describe("eval", function () {
        it("0.1+0.2", function () {
            expect(evaluate("0.1+0.2")?.toNumber()).to.equal(0.3)
        })
        it("1+2", function () {
            expect(evaluate("1+2")?.toNumber()).to.equal(3)
        })
        it("3-2", function () {
            expect(evaluate("3-2")?.toNumber()).to.equal(1)
        })
        it("2*3", function () {
            expect(evaluate("2*3")?.toNumber()).to.equal(6)
        })
        it("6/2", function () {
            expect(evaluate("6/2")?.toNumber()).to.equal(3)
        })
        it("-1", function () {
            expect(evaluate("-1")?.toNumber()).to.equal(-1)
        })
        it("1+-4", function () {
            expect(evaluate("1+-4")?.toNumber()).to.equal(-3)
        })
        it("6*2+14/7-3", function () {
            expect(evaluate("6*2+14/7-3")?.toNumber()).to.equal(11)
        })
    })
})