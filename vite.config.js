import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
// import glsl from 'vite-plugin-glsl'

export default defineConfig({
    //   plugins: [glsl()]
    build: {
        lib: {
            formats: ['es'],
            entry: 'src/main.tsx',
        },
    }, plugins: [
        solidPlugin({ solid: { moduleName: "toad.jsx" } })
    ],
})