import { changeSaturationLightBy } from "toad.js/util/color"

const listBackgroundNormal = "#000000"
// const listBackgroundSelected = "#2a436a"
const listBackgroundSelected = "#1d314d"

const theme = {
    ui: {
        list: {
            background: "#282828",
            item: {
                color: {
                    normal: "#CCCCCC",
                    selected: "#FFFFFF"
                },
                background: {
                    normal: "rgba(0,0,0,0)",
                    hover: changeSaturationLightBy(listBackgroundNormal, 0, 20),

                    selected: listBackgroundSelected,
                    selectedHover: changeSaturationLightBy(listBackgroundSelected, -10, 10),

                    active: changeSaturationLightBy(listBackgroundSelected, 0, 10),
                    activeHover: changeSaturationLightBy(listBackgroundSelected, -10, 20),
                },
                outline: {
                    active: changeSaturationLightBy(listBackgroundSelected, 0, 30),
                    activeHover: changeSaturationLightBy(listBackgroundSelected, -10, 40),
                }
            }
        }
    },
    outliner: {
        filterMatch: "#337f33",
        /**
         * the color of selected items
         */
        selectedHighlight: "#1d314d",
        /**
         * the color of selected items holding the focus / caret
         */
        activeHighlight: "#334d80",

        // note: active/selected highlights are about the outliners selected items
        //       not the active/selected objects, which are indicated by text color
        // note: hover always adds to the background
        // note: the active highlight also has an outline

        selectedObjects: "#e96a00",
        activeObject: "#ffaf29",

        editedObject: "#00806266",
        alternateRows: "#ffffff04",
        text: {
            normal: "#CCCCCC",
            selected: "#FFFFFF"
        }
    }
}

export function initTheme() {
    const themeCSS = new CSSStyleSheet()
    themeCSS.replaceSync(theme2css())
    document.adoptedStyleSheets = [themeCSS]
}

function theme2css() {
    const result = `:root {${theme2css_helper(theme, "  --tx", "")}\n}`
    // const vars: typeof theme = theme2css_vars(theme, "--tx") as any
    return result
}

function theme2css_helper(theme: any, prefix: string, out: string) {
    for (const name of Object.getOwnPropertyNames(theme)) {
        const key = name.replace(/[A-Z]/g, it => `-${it.toLowerCase()}`)
        const value = theme[name]
        if (typeof value === "object") {
            out = theme2css_helper(value, `${prefix}-${key}`, out)
        } else {
            out = `${out}\n${prefix}-${key}: ${value};`
        }
    }
    return out
}

function theme2css_vars(theme: any, prefix: string, out: any = {}) {
    for (const name of Object.getOwnPropertyNames(theme)) {
        // console.log(`  ${name}`)
        const key = prefix + '-' + name.replace(/[A-Z]/g, it => `-${it.toLowerCase()}`)
        const value = theme[name]
        if (typeof value === "object") {
            out[name] = {}
            theme2css_vars(value, key, out[name])
        } else {
            out[name] = `var(${key})`
        }
    }
    return out
}


// console.log(theme2css())
// const x = theme2css_names({
//     helloWorld: "",
//     list: {
//         color: ""
//     }
// }, "--tx")
// console.log(x)