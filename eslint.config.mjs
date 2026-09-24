import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's version auto-detection is broken on ESLint 10.
  { settings: { react: { version: '19.3' } } },
  // Icons and wallpapers are small static SVGs; next/image adds nothing for them.
  { rules: { '@next/next/no-img-element': 'off' } },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/generated/**', 'test-results/**', 'playwright-report/**', 'input/**']),
])
