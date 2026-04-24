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
    element: HTMLElement = undefined as any
    how: How[] = [How.NONE, How.NONE, How.NONE, How.NONE]
    which: (HTMLElement | undefined)[] = [undefined, undefined, undefined, undefined]
    dist: number[] = [0, 0, 0, 0]
    coord: number[] = [0, 0, 0, 0]
    w: number = 0
    h: number = 0
    done = 0    // flags for attached sides
    nflag = 0   // flags for sides with undefined attachment
}

const debug = false

/**
 * HTML/CSS is designed with text documents in mind.
 * 
 * 
 */
export class SpringLayout {
    private flist = new Map<HTMLElement, FormNode>()
    p!: HTMLElement

    parent: HTMLElement
    canvas: HTMLElement
    constructor(def: SpringDefinition[]) {
        this.initialize(def)
        this.resize = this.resize.bind(this)
        this.canvas = document.querySelector<HTMLCanvasElement>('canvas')!
        if (this.canvas === null) {
            throw Error("#canvas not found")
        }
        this.parent = this.canvas.parentElement!
        new ResizeObserver(this.resize).observe(this.canvas.parentElement!)
        requestAnimationFrame(this.resize)
    }
    initialize(def: SpringDefinition[]) {
        let p: HTMLElement | undefined
        for (const d of def) {
            if (p === undefined) {
                if (d.element.parentElement === null) {
                    throw Error(`element needs parent`)
                }
                p = d.element.parentElement
                this.p = p
            } else {
                if (d.element.parentElement !== p) {
                    throw Error('children have different parents')
                }
            }

            let node = this.flist.get(d.element)
            if (node === undefined) {
                node = new FormNode()
                node.element = d.element
                this.flist.set(d.element, node)
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
    resize() {
        debug && console.log("==========================================================================")
        // console.log(`resize 2`)
        // const p = this.parent.getBoundingClientRect()
        // console.log(p)

        // const c = this.canvas.getBoundingClientRect()
        // console.log(c)

        // this.canvas.style.top = `56px`
        // this.canvas.style.width = `${p.width - 2}px`
        // this.canvas.style.height = `${p.height - 2 - 56}px`

        // initialize data structures
        //---------------------------- 
        for (const ptr of this.flist.values()) {
            ptr.done = 0
            ptr.nflag = 0
            const shape = ptr.element.getBoundingClientRect()
            ptr.coord[TOP] = shape.top
            ptr.coord[BOTTOM] = shape.top + shape.height
            ptr.coord[LEFT] = shape.left
            ptr.coord[RIGHT] = shape.left + shape.width
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

            debug && console.log(`<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" ${ptr.done} ${ptr.nflag}/>`)
        }
        const form = [0, 0, 0, 0]
        {
            const shape = this.p.getBoundingClientRect()
            form[TOP] = shape.top
            form[BOTTOM] = shape.top + shape.height
            form[LEFT] = shape.left
            form[RIGHT] = shape.left + shape.width
        }

        // arrange children
        //+-----------------

        const nChildren = this.flist.size
        let bKeepOwnBorder = true
        let nBorderOverlap = 0

        let count = 0
        let done = 0 // we're done when `done' equals `nChildren'

        for (const ptr of this.flist.values()) {
            ++count
            if (ptr.done != HAS_ALL) {
                // window has non attached sides
                //-------------------------------

                // 1st strategy:
                // attach all sides where the opposite side of another object is known
                //---------------------------------------------------------------------

                const ename = `<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" />`

                for (let i = 0; i < 4; i++) {
                    if (!(ptr.done & (1 << i))) {
                        // console.log(`    ${How[ptr.how[i]]}`)
                        switch (ptr.how[i]) {
                            case How.FORM: {
                                debug && console.log(`${ename}: attach ${Side[i]} to form`)
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
                                debug && console.log(`${ename}: attach ${Side[i]} to element`)
                                const ptr2 = this.flist.get(ptr.which[i]!)! // opposite window
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
                    const shape = ptr.element.getBoundingClientRect()

                    //         printf("Placing %s now:\n",ptr->name.c_str());
                    //         #endif
                    //         // no top and/or left attachment
                    //         #ifdef DEBUG
                    if (ptr.nflag & HAS_T) {
                        debug && console.log(`${ename}: has no top attachment, calculating it from bottom(${ptr.coord[BOTTOM]}) - height(${shape.height})`)
                        ptr.coord[TOP] = ptr.coord[BOTTOM] - shape.height
                    }
                    if (ptr.nflag & HAS_B) {
                        debug && console.log(`${ename}: has no bottom attachment, calculating it from top(${ptr.coord[TOP]}) + height(${shape.height})`)
                        ptr.coord[BOTTOM] = ptr.coord[TOP] + shape.height
                    }
                    if (ptr.nflag & HAS_L) {
                        debug && console.log(`${ename}: has no left attachment, calculating it from right(${ptr.coord[RIGHT]}) - width(${shape.width})`)
                        ptr.coord[LEFT] = ptr.coord[RIGHT] - shape.width
                    }
                    if (ptr.nflag & HAS_R) {
                        debug && console.log(`${ename}: has no right attachment, calculating it from left(${ptr.coord[RIGHT]}) + width(${shape.width})`)
                        ptr.coord[RIGHT] = ptr.coord[LEFT] + shape.width
                    }

                    // (here has been a part in the C++ implementation, were we set the size, calculate again, then set the position)

                    const x = ptr.coord[LEFT]
                    const y = ptr.coord[TOP]
                    const w = ptr.coord[RIGHT] - ptr.coord[LEFT]
                    const h = ptr.coord[BOTTOM] - ptr.coord[TOP]
                    debug && console.log(`<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" /> -> ${x}, ${y}, ${w}, ${h}`)
                    ptr.element.style.position = 'absolute'
                    ptr.element.style.left = `${x}px`
                    ptr.element.style.top = `${y}px`
                    ptr.element.style.width = `${w}px`
                    ptr.element.style.height = `${h}px`

                    ptr.done = HAS_ALL
                    ++done
                    //         #ifdef DEBUG
                    //         printf("  set to (%i,%i)-(%i,%i)\n" ,ptr->coord[DLEFT]
                    //                                             ,ptr->coord[DTOP]
                    //                                             ,ptr->coord[DRIGHT]
                    //                                             ,ptr->coord[DBOTTOM] );
                    //         #endif
                }
            }

            if (done >= nChildren) {
                debug && console.log("done")
                // //      cout << "TForm: >>>done<<<" << endl;
                //       running = false;
                return
            }

            //     if (count>nChildren) {
            //       bool bNoGuess = true;
            //       count=0;
            //       while(count<nChildren) {
            //         if (ptr->done != HAS_ALL) {
            //           ptr->getShape(window, &shape);
            //           if ( (ptr->nflag&LEFT) && !(ptr->done&LEFT) && (ptr->done&RIGHT) ) {
            //             #ifdef DEBUG
            //             printf("guessing left side of %s\n",ptr->name.c_str());
            //             #endif
            //             ptr->coord[DLEFT] = ptr->coord[DRIGHT] - shape.w;
            //             ptr->done|=HAS_L;
            //             bNoGuess = false;
            //           }
            //           if ( (ptr->nflag&RIGHT) && !(ptr->done&RIGHT) && (ptr->done&LEFT) ) {
            //             #ifdef DEBUG
            //             printf("guessing right side of %s\n",ptr->name.c_str());
            //             #endif
            //             ptr->coord[DRIGHT] = ptr->coord[DLEFT] + shape.w;
            //             ptr->done|=HAS_R;
            //             bNoGuess = false;
            //           }
            //           if ( !(ptr->nflag&TOP) && !(ptr->done&TOP) && (ptr->done&BOTTOM) ) {
            //             #ifdef DEBUG
            //             printf("guessing top side of %s\n",ptr->name.c_str());
            //             #endif
            //             ptr->coord[DTOP] = ptr->coord[DBOTTOM] - shape.h;
            //             ptr->done|=HAS_T;
            //             bNoGuess = false;
            //           }
            //           if ( (ptr->nflag&BOTTOM) && !(ptr->done&BOTTOM) && (ptr->done&TOP) ) {
            //             #ifdef DEBUG
            //             printf("guessing bottom side of %s\n",ptr->name.c_str());
            //             #endif
            //             ptr->coord[DBOTTOM] = ptr->coord[DTOP] + shape.h;
            //             ptr->done|=HAS_B;
            //             bNoGuess = false;
            //           }
            //           if (ptr->done == HAS_ALL) {
            //             cout << "TForm: looks like recursive attachment" << endl;
            //           }
            //         }
            //         count++;
            //         ptr = ptr->next;
            //       }

            //       if(bNoGuess) {
            //         printf("*TForm: Can't handle recursive attachment. Stopped.\n");
            //         #ifdef DEBUG
            //         count=0;
            //         while(count<nChildren) {
            //           printf("%25s : ",ptr->name.c_str());
            //           printf( ptr->done&HAS_T ? "t" : "-");
            //           printf( ptr->done&HAS_B ? "b" : "-");
            //           printf( ptr->done&HAS_L ? "l" : "-");
            //           printf( ptr->done&HAS_R ? "r" : "-");
            //           printf("\n");
            //           count++;
            //           ptr = ptr->next;
            //         } 
            //         #endif
            //         running = false;
            //         return;
            //       }
            //       #ifdef DEBUG
            //       printf("trying again\n");
            //       #endif
            //       count = 0;
            //     }
            //     ptr = ptr->next;
            // break
        }
        // for (const ptr of this.flist.values()) {
        //     const x = ptr.coord[LEFT]
        //     const y = ptr.coord[TOP]
        //     const w = ptr.coord[RIGHT] - ptr.coord[LEFT]
        //     const h = ptr.coord[BOTTOM] - ptr.coord[TOP]
        //     console.log(`<${ptr.element.nodeName.toLowerCase()} class="${ptr.element.className}" /> -> ${x}, ${y}, ${w}, ${h}`)
        //     ptr.element.style.position = 'absolute'
        //     ptr.element.style.left = `${x}px`
        //     ptr.element.style.top = `${y}px`
        //     ptr.element.style.width = `${w}px`
        //     ptr.element.style.height = `${h}px`
        // }
    }
}
