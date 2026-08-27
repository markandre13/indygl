import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    plugins: [
        glsl(),
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