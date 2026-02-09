import {defineConfig} from 'vite'

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'GenerateRouteVue',
            fileName: 'generate-route-vue',
            formats: ['es']
        }
    }
})
