import { bind } from "../appkit/details/decorators/bind"

// type SpringHow = "none" | "form" | "window" | "opposite"
type SpringWhere = "top" | "bottom" | "left" | "right"

enum How {
    NONE, FORM, ELEMENT, OPPOSITE
}

export interface SpringDefinition {
    element: HTMLElement
    where: SpringWhere[]
    which?: HTMLElement
    width?: number
    height?: number
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

const Side = ["TOP", "BOTTOM", "LEFT", "RIGHT"]

class FormNode {
    element!: HTMLElementApi
    shape!: DOMRect
    how: How[] = [How.NONE, How.NONE, How.NONE, How.NONE]
    which: (HTMLElementApi | undefined)[] = [undefined, undefined, undefined, undefined]
    dist: number[] = [0, 0, 0, 0] // nope, that's what margin is for
    coord: number[] = [0, 0, 0, 0]
    w: number = 0
    h: number = 0
    done = 0    // flags for attached sides
    nflag = 0   // flags for sides with undefined attachment
}

const debug = false

export interface CSSStyleDeclarationApi {
    position: string
    boxSizing: string
    left: string
    top: string
    width: string
    height: string
}

export interface HTMLElementApi {
    parentElement: HTMLElementApi | null
    getBoundingClientRect: () => DOMRect
    style: CSSStyleDeclarationApi
}

/**
 * HTML/CSS is designed with text documents in mind.
 * 
 * 
 */
export class SpringLayout {
    #def = new Map<HTMLElementApi, FormNode>()
    #parent!: HTMLElementApi

    constructor(def: SpringDefinition[]) {
        this.#initialize(def)
        if (this.#parent instanceof HTMLElement) {
            new ResizeObserver(this.resize).observe(this.#parent)
        }
        this.resize()
    }
    #initialize(def: SpringDefinition[]) {
        let p: HTMLElementApi | undefined
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
            if (d.where.includes("top")) {
                node.which[TOP] = d.which
                node.how[TOP] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes("bottom")) {
                node.which[BOTTOM] = d.which
                node.how[BOTTOM] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes("left")) {
                node.which[LEFT] = d.which
                node.how[LEFT] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
            if (d.where.includes("right")) {
                node.which[RIGHT] = d.which
                node.how[RIGHT] = d.which !== undefined ? How.ELEMENT : How.FORM
            }
        }
    }
    private _invalidated = false
    @bind resize() {
        if (this._invalidated) {
            return
        }
        this._invalidated = true
        requestAnimationFrame(this.arrange)
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
                console.log('has undefined attachment')
                console.log(ptr)
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
            form[TOP] = shape.top
            form[BOTTOM] = shape.top + shape.height
            form[LEFT] = shape.left
            form[RIGHT] = shape.left + shape.width
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
                                const ptr2 = this.#def.get(ptr.which[i]!)! // opposite window
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
                } // end of the 1st strategy

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

                    const x = ptr.coord[LEFT]
                    const y = ptr.coord[TOP]
                    const w = ptr.coord[RIGHT] - ptr.coord[LEFT]
                    const h = ptr.coord[BOTTOM] - ptr.coord[TOP]
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
