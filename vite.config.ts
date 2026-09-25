import fs from 'fs'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const root = process.cwd()

function rootAlias(): Plugin {
  return {
    name: 'root-alias',
    resolveId: {
      order: 'pre',
      filter: { id: /^@\// },
      handler(id) {
        const abs = path.resolve(root, id.slice(2))
        const candidates = [
          abs,
          `${abs}.ts`,
          `${abs}.tsx`,
          `${abs}.js`,
          path.join(abs, 'index.ts'),
          path.join(abs, 'index.tsx'),
        ]
        return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null
      },
    },
  }
}

export default defineConfig({
  plugins: [rootAlias(), react()],
  server: {
    host: true,
  },
})
