const theme = {
    ui: {
        list: {
            color: {
                normal: "#CCCCCC",
                selected: "#FFFFFF"
            },
            background: {
                normal: "#FFFFFF00",
                selected: "#4772B3FF"
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
    themeCSS.replaceSync(theme2css(theme))
    document.adoptedStyleSheets = [themeCSS]
}

function theme2css(theme: any) {
    const result = `:root {${theme2css_helper(theme, "  --tx", "")}\n}`
    console.log(result)
    return result
}

function theme2css_helper(theme: any, prefix: string, out: string) {
    for (const key of Object.getOwnPropertyNames(theme)) {
        const value = theme[key]
        if (typeof value === "object") {
            out = theme2css_helper(value, `${prefix}-${key}`, out)
        } else {
            out = `${out}\n${prefix}-${key}: ${value};`
        }
    }
    return out
}