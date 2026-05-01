import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'
// import glsl from 'vite-plugin-glsl'

export default defineConfig({
    //   plugins: [glsl()]
    build: {
        lib: {
            formats: ['es'],
            entry: 'src/main.tsx',
        },
    }, plugins: [
        tsconfigPaths(),
        solidPlugin({ solid: { moduleName: "toad.jsx" } }),
    ],
})