import BigNumber from 'bignumber.js'
import { ExpressionNode } from './ExpressionNode'
import { Lexer } from './Lexer'
import type { Unit } from '../../units/Unit'

export function evaluate(expr: string, unit?: Unit): BigNumber | undefined {
    return additive_expression(new Lexer(expr))?.eval(unit)
}
export function expression(expr: string): ExpressionNode | undefined {
    const lexer = new Lexer(expr)
    return additive_expression(lexer)
}
function additive_expression(lexer: Lexer): ExpressionNode | undefined {
    const n0 = multiplicative_expression(lexer)
    if (n0 === undefined) {
        return undefined
    }

    const n1 = lexer.lex()
    if (n1 === undefined) {
        return n0
    }
    if (n1.value === "+" || n1.value === "-") {
        const n2 = additive_expression(lexer)
        if (n2 === undefined) {
            lexer.unlex(n1)
            return n0
        }
        n1.append(n0)
        n1.append(n2)
        return n1
    }
    lexer.unlex(n1)
    return n0
}
function multiplicative_expression(lexer: Lexer): ExpressionNode | undefined {
    const n0 = unary_expression(lexer)
    if (n0 === undefined) {
        return undefined
    }
    const n1 = lexer.lex()
    if (n1 === undefined) {
        return n0
    }
    if (n1.value === "*" || n1.value === "/") {
        const n2 = multiplicative_expression(lexer)
        if (n2 === undefined) {
            throw Error(`expexted expression after ${n1.value}`)
        }
        n1.append(n0)
        n1.append(n2)
        return n1
    }
    lexer.unlex(n1)
    return n0
}
function unary_expression(lexer: Lexer): ExpressionNode | undefined {
    const n0 = lexer.lex()
    if (n0 === undefined) {
        return undefined
    }
    if (n0.value instanceof BigNumber) {
        const n1 = identifier(lexer)
        if (n1 !== undefined) {
            n0.append(n1)
        }
        return n0
    }
    if (n0.value === "(") {
        const n1 = additive_expression(lexer)
        if (n1 === undefined) {
            throw Error("Unexpected end after '(")
        }
        const n2 = lexer.lex()
        if (n2?.value !== ')') {
            throw Error("Excepted ')")
        }
        return n1
    }
    if (n0.value === "-") {
        const n1 = unary_expression(lexer)
        if (n1 !== undefined) {
            n0.append(n1)
            return n0
        }
    }
    lexer.unlex(n0)
    return undefined
}
function identifier(lexer: Lexer) {
    const n1 = lexer.lex()
    if (typeof n1?.value === "string" && Lexer.isalpha(n1.value)) {
        return n1
    }
    lexer.unlex(n1)
}