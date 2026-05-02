import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
// import glsl from 'vite-plugin-glsl'

export default defineConfig({
    //   plugins: [glsl()]
    resolve: {
        tsconfigPaths: true
    },
    build: {
        lib: {
            formats: ['es'],
            entry: 'src/main.tsx',
        },
    }, plugins: [
        // [glsl()],
        solidPlugin({ solid: { moduleName: "toad.jsx" } }),
    ],
})