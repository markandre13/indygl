import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    resolve: {
        tsconfigPaths: true
    },
    test: {
        browser: {
            provider: playwright(),
            enabled: true,
            // at least one instance is required
            instances: [
                { browser: 'chromium', headless: true },
            ],
        },
    }
})