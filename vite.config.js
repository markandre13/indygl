import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import glsl from 'vite-plugin-glsl'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    plugins: [
        glsl(),
        solidPlugin({ solid: { moduleName: "toad.jsx" } }),
    ],
    resolve: {
        // the tsconfig is for tsc
        tsconfig: false,
        tsconfigPaths: false,
        // tsconfig's paths mapped to js/
        alias: {
            "src": "/js/src",
            "appkit": "/js/src/editor/appkit",
            "viewkit": "/js/src/editor/viewkit"
        },
    },
    build: {
        lib: {
            formats: ['es'],
            entry: 'js/src/main.jsx',
        },
    },
    test: {
        environment: "node",
        browser: {
            provider: playwright(),
            enabled: true,
            instances: [
                { browser: 'chromium', headless: true },
            ],
        },
        reporters: [
            ['tree', { summary: false }]
        ]
    },
})