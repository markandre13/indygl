import type { JSX } from "toad.jsx/jsx-runtime"
import { bind } from "../appkit/details/decorators/bind"

// type SpringHow = "none" | "form" | "window" | "opposite"

/**
 * Specifies which sides of an element to position.
 */
enum SpringWhere {
    TOP, BOTTOM, LEFT, RIGHT
}

enum How {
    NONE, FORM, ELEMENT, OPPOSITE
}

/**
 * Definition for how an element should be positioned.
 */
export interface SpringDefinition {
    /** The HTML element to position */
    element: SpringLayoutElementApi
    /** Which sides to position */
    where: SpringWhere[]
    /** Optional reference element for element-based positioning */
    which?: SpringLayoutElementApi

    /** Optional width for the element */
    // width?: number
    /** Optional height for the element */
    // height?: number
}

const HAS_T = 1
const HAS_B = 2
const HAS_L = 4
const HAS_R = 8
const HAS_ALL = 15
const TOP = 0
const BOTTOM = 1
const LEFT = 2
const RIGHT = 3

class FormNode {
    element!: SpringLayoutElementApi
    shape!: DOMRectApi
    how: How[] = [How.NONE, How.NONE, How.NONE, How.NONE]
    which: (SpringLayoutElementApi | undefined)[] = [undefined, undefined, undefined, undefined]
    dist: number[] = [0, 0, 0, 0] // TODO: this is what margin is for
    coord: number[] = [0, 0, 0, 0]
    w: number = 0
    h: number = 0
    done = 0    // flags for attached sides
    nflag = 0   // flags for sides with undefined attachment
}

const debug = false

interface CSSStyleDeclarationApi {
    position: string
    boxSizing: string
    left: string
    top: string
    width: string
    height: string
}

interface DOMRectApi {
    left: number
    top: number
    width: number
    height: number
}

export interface SpringLayoutElementApi {
    parentElement: SpringLayoutElementApi | null
    getBoundingClientRect: () => DOMRectApi
    style: CSSStyleDeclarationApi
}

/**
 * SpringLayout provides a flexible layout system for positioning HTML elements
 * using spring-based constraints similar to traditional GUI layout managers.
 * 
 * Elements can be positioned relative to their parent container (form-based)
 * or relative to other elements (element-based).
 * 
 * @example Using fluent API:
 * ```typescript
 * SpringLayout.create()
 *   .element(element1).top().left()
 *   .element(element2).top(element1)
 *   .build()
 * ```
 */
export class SpringLayout {
    #def = new Map<SpringLayoutElementApi, FormNode>()
    #parent!: SpringLayoutElementApi

    /**
     * Fluent API for building SpringLayout definitions
     */
    static create() { return new SpringLayoutBuilder() }

    constructor(def: SpringDefinition[]) {
        this.#initialize(def)
        if (this.#parent instanceof HTMLElement) {
            new ResizeObserver(this.resize).observe(this.#parent)
        }
        this.resize()
    }
    #initialize(def: SpringDefinition[]) {
        let p: SpringLayoutElementApi | undefined
        for (const d of def) {
            if (p === undefined) {
                if (d.element.parentElement === null) {
                    throw Error(`element needs parent`)
                }
                p = d.element.parentElement
                this.#parent = p
            } else {
                if (d.element.parentElement !== p) {
                    throw Error('children have different parents')
                }
            }

            let node = this.#def.get(d.element)
            if (node === undefined) {
                node = new FormNode()
                node.element = d.element
                this.#def.set(d.element, node)
            }
            if (d.where.includes(SpringWhere.TOP)) {
                node.which[TOP] = d.which
                node.how[TOP] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes(SpringWhere.BOTTOM)) {
                node.which[BOTTOM] = d.which
                node.how[BOTTOM] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes(SpringWhere.LEFT)) {
                node.which[LEFT] = d.which
                node.how[LEFT] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes(SpringWhere.RIGHT)) {
                node.which[RIGHT] = d.which
                node.how[RIGHT] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
        }

        const check = (n: FormNode, a: number, an: string, b: number, bn: string) => {
            let m = n.which[a]
            if (m) {
                let o = this.#def.get(m)!
                if (o.which[b] === n.element) {
                    throw Error(`FormLayout: circular dependency between ${an} and ${bn}`)
                }
            }
        }

        const walk = (n: FormNode) => {
            check(n, LEFT, "left", RIGHT, "right")
            check(n, RIGHT, "right", LEFT, "left")
            check(n, TOP, "top", BOTTOM, "bottom")
            check(n, BOTTOM, "bottom", TOP, "top")
        }

        // check for recursion
        for (const n of this.#def.values()) {
            walk(n)
        }
    }
    private _invalidated = false
    @bind resize() {
        if (this._invalidated) {
            return
        }
        this._invalidated = true
        if (this.#parent instanceof HTMLElement) {
            requestAnimationFrame(this.arrange)
        } else {
            this.arrange()
        }
    }
    @bind arrange() {
        this._invalidated = false
        debug && console.log("==========================================================================")

        // initialize data structures
        //---------------------------- 
        for (const ptr of this.#def.values()) {
            ptr.done = 0
            ptr.nflag = 0
            ptr.shape = ptr.element.getBoundingClientRect()
            ptr.coord[TOP] = ptr.shape.top
            ptr.coord[BOTTOM] = ptr.shape.top + ptr.shape.height
            ptr.coord[LEFT] = ptr.shape.left
            ptr.coord[RIGHT] = ptr.shape.left + ptr.shape.width
            for (let i = 0; i < 4; i++) {
                if (ptr.how[i] === How.NONE) {
                    ptr.nflag |= (1 << i)
                }
            }
            if ((ptr.nflag & 3) == 3 || (ptr.nflag & 12) == 12) {
                //     if (!ptr -> it(window) -> flagShell && !ptr -> it(window) -> flagPopup) {
                // console.log('has undefined attachment')
                // console.log(ptr)
                //         fprintf(stderr, "toad: '%s' within TForm has undefined attachment\n",
                //             ptr -> name.c_str())
                //         bError = true
                //     }
            }

            // debug && console.log(`<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" ${ptr.done} ${ptr.nflag}/>`)
        }
        const form = [0, 0, 0, 0]
        {
            const shape = this.#parent.getBoundingClientRect()
            form[BOTTOM] = shape.height
            form[RIGHT] = shape.width
        }

        // arrange children
        //+-----------------

        const nChildren = this.#def.size
        let bKeepOwnBorder = true
        let nBorderOverlap = 0

        let count = 0
        let done = 0 // we're done when `done' equals `nChildren'

        let iterator = this.#def.values()

        while (true) {
            if (count > 1000) {
                throw Error(`FormLayout algorithm exceeded ${count} iterations. There might be an uncaught recursion.`)
            }
            let next = iterator.next()
            if (next.done) {
                iterator = this.#def.values()
                next = iterator.next()
            }
            const ptr = next.value!

            ++count
            if (ptr.done != HAS_ALL) {
                // window has non attached sides
                //-------------------------------

                // 1st strategy:
                // attach all sides where the opposite side of another object is known
                //---------------------------------------------------------------------

                // const ename = `<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" />`

                for (let i = 0; i < 4; i++) {
                    if (!(ptr.done & (1 << i))) {
                        // console.log(`    ${How[ptr.how[i]]}`)
                        switch (ptr.how[i]) {
                            case How.FORM: {
                                // debug && console.log(`${ename}: attach ${Side[i]} to form`)
                                ptr.done |= (1 << i)
                                ptr.coord[i] = form[i]
                                if (!bKeepOwnBorder) {
                                    if (i & 1) {
                                        ptr.coord[i] += nBorderOverlap
                                    } else {
                                        ptr.coord[i] -= nBorderOverlap
                                    }
                                }
                                if (i & 1) {
                                    ptr.coord[i] -= ptr.dist[i]
                                } else {
                                    ptr.coord[i] += ptr.dist[i]
                                }
                                count = 0
                            } break
                            case How.ELEMENT: {
                                // debug && console.log(`${ename}: attach ${Side[i]} to element`)
                                if (!ptr.which[i]) {
                                    throw Error(`no which for ${How[i]} ${ptr}`)
                                }
                                const ptr2 = this.#def.get(ptr.which[i]!) // opposite window
                                if (!ptr2) {
                                    throw Error(`no form node for ${How[i]} ${ptr}`)
                                }
                                if ((ptr2.done) & (1 << (i ^ 1))) {    // opposite side is set
                                    ptr.done |= (1 << i)
                                    ptr.coord[i] = ptr2.coord[i ^ 1]
                                    if (i & 1) { // bottom & right
                                        ptr.coord[i] += nBorderOverlap
                                        ptr.coord[i] -= Math.max(ptr.dist[i], ptr2.dist[i ^ 1])
                                    } else { // top & left
                                        ptr.coord[i] -= nBorderOverlap
                                        ptr.coord[i] += Math.max(ptr.dist[i], ptr2.dist[i ^ 1])
                                    }
                                    count = 0
                                }
                            } break
                            //             case OPPOSITE_WINDOW: // CODE IS MISSING FOR DISTANCE !!!
                            //               ptr2=_find(ptr->whichname[i]);
                            //               if ((ptr2->done) & (1<<(i))) {
                            //                 ptr->done |=(1<<i);
                            //                 ptr->coord[i] = ptr2->coord[i];
                            //                 count = 0;
                            //               }
                            //               break;
                        }
                    }
                }

                // PLACE WINDOW
                if ((ptr.done | ptr.nflag) === HAS_ALL) {
                    // 2nd strategy
                    // we're almost done with the window, the missing coordinates
                    // can be calculated from the objects size
                    //------------------------------------------------------------
                    // console.log(`2nd strategy`)
                    if (ptr.nflag & HAS_T) {
                        // debug && console.log(`${ename}: has no top attachment, calculating it from bottom(${ptr.coord[BOTTOM]}) - height(${ptr.shape.height})`)
                        ptr.coord[TOP] = ptr.coord[BOTTOM] - ptr.shape.height
                    }
                    if (ptr.nflag & HAS_B) {
                        // debug && console.log(`${ename}: has no bottom attachment, calculating it from top(${ptr.coord[TOP]}) + height(${ptr.shape.height})`)
                        ptr.coord[BOTTOM] = ptr.coord[TOP] + ptr.shape.height
                    }
                    if (ptr.nflag & HAS_L) {
                        // debug && console.log(`${ename}: has no left attachment, calculating it from right(${ptr.coord[RIGHT]}) - width(${ptr.shape.width})`)
                        ptr.coord[LEFT] = ptr.coord[RIGHT] - ptr.shape.width
                    }
                    if (ptr.nflag & HAS_R) {
                        // debug && console.log(`${ename}: has no right attachment, calculating it from left(${ptr.coord[RIGHT]}) + width(${ptr.shape.width})`)
                        ptr.coord[RIGHT] = ptr.coord[LEFT] + ptr.shape.width
                    }

                    // (here has been a part in the C++ implementation, were we set the size, calculate again, then set the position)

                    // const style = getComputedStyle(ptr.element)
                    // console.log(parseFloat(style.paddingLeft))

                    let x = ptr.coord[LEFT]
                    let y = ptr.coord[TOP]
                    let w = ptr.coord[RIGHT] - ptr.coord[LEFT]
                    let h = ptr.coord[BOTTOM] - ptr.coord[TOP]
                    if (w < 0) {
                        w = -w
                        x -= w
                    }
                    if (h < 0) {
                        h = -h
                        y -= h
                    }

                    // debug && console.log(`<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" /> -> ${x}, ${y}, ${w}, ${h}`)
                    // ptr.element.style.
                    ptr.element.style.position = 'absolute'
                    ptr.element.style.boxSizing = 'border-box'
                    ptr.element.style.left = `${x}px`
                    ptr.element.style.top = `${y}px`
                    ptr.element.style.width = `${w}px`
                    ptr.element.style.height = `${h}px`

                    ptr.done = HAS_ALL
                    ++done
                }
            }

            if (done >= nChildren) {
                debug && console.log("done")
                return
            }
        }
    }
}

/**
 * Builder class for creating SpringLayout definitions with a fluent API.
 * 
 * @example
 * ```typescript
 * SpringLayout.create()
 *   .element(element1).top().left()
 *   .element(element2).top(element1)
 *   .build()
 * ```
 */
class SpringLayoutBuilder {
    private definitions: SpringDefinition[] = [];
    private currentElement?: SpringLayoutElementApi

    /**
     * Specifies the element to be positioned.
     * 
     * @param element The HTML element to position
     * @returns This builder instance for chaining
     */
    element(element: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        if ("current" in element) { element = element.current }
        this.currentElement = element
        return this
    }

    /**
     * Adds top positioning constraint. Optionally specify an element to position
     * this element relative to.
     * 
     * @param element Optional element to position relative to
     * @returns This builder instance for chaining
     */
    top(element?: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        return this.define(SpringWhere.TOP, element)
    }

    /**
     * Adds bottom positioning constraint. Optionally specify an element to position
     * this element relative to.
     * 
     * @param element Optional element to position relative to
     * @returns This builder instance for chaining
     */
    bottom(element?: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        return this.define(SpringWhere.BOTTOM, element)
    }

    /**
     * Adds left positioning constraint. Optionally specify an element to position
     * this element relative to.
     * 
     * @param element Optional element to position relative to
     * @returns This builder instance for chaining
     */
    left(element?: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        return this.define(SpringWhere.LEFT, element)
    }

    /**
     * Adds right positioning constraint. Optionally specify an element to position
     * this element relative to.
     * 
     * @param element Optional element to position relative to
     * @returns This builder instance for chaining
     */
    right(element?: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        return this.define(SpringWhere.RIGHT, element)
    }

    /**
     * Finalizes the SpringLayout definition and creates a new SpringLayout instance.
     * 
     * @returns A new SpringLayout instance with the defined constraints
     */
    build(): SpringLayout {
        return new SpringLayout(this.definitions)
    }

    private define(where: SpringWhere, which?: SpringLayoutElementApi | JSX.Ref<SpringLayoutElementApi>): SpringLayoutBuilder {
        if (which && "current" in which) { which = which.current }
        for (const def of this.definitions) {
            if (def.element === this.currentElement && def.which === which) {
                if (!def.where.includes(where)) {
                    def.where.push(where)
                }
                return this
            }
        }
        this.definitions.push({
            element: this.currentElement!,
            where: [where],
            which
        })
        return this
    }
}