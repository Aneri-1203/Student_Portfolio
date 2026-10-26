import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore generated output, dependencies, and the backend (Node/CommonJS)
  globalIgnores(['dist', 'node_modules', 'backend']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This rule fires on valid patterns like setLoading(false) inside an
      // early-return guard in useEffect. Downgrade to a warning so the build
      // is not blocked while still surfacing the advice.
      'react-hooks/set-state-in-effect': 'warn',
      // Unused catch-binding variables are fine in simple error guards
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      // AuthContext exports both AuthProvider (component) and useAuth (hook)
      // from the same file. This is a common React pattern. The rule is
      // configured to allow hook exports alongside component exports.
      'react-refresh/only-export-components': [
        'warn',
        { allowExportNames: ['useAuth'] },
      ],
    },
  },
])
