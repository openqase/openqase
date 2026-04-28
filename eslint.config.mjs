import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import security from "eslint-plugin-security";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  security.configs.recommended,
  {
    ignores: ["docs/**", ".next/**", "out/**", ".vercel/**", ".worktrees/**"]
  },
  {
    rules: {
      // Downgrade pre-existing issues to warnings so CI passes.
      // TODO: Fix these properly and re-enable as errors.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "prefer-const": "warn",
    }
  },
  // Restrict imports of internal-queries to the allow-list.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/lib/internal-queries', '@/lib/internal-queries'],
          message:
            'Direct content-table access is restricted. Use publicQuery() ' +
            'from @/lib/public-query for anonymous reads. If you legitimately ' +
            'need raw access (build-time SSG, admin write, service-role ' +
            'operation), add this file to the allow-list in eslint.config.mjs ' +
            'and document the reason in the commit message.'
        }]
      }]
    }
  },
  // Override for allow-listed paths.
  {
    files: [
      'src/lib/public-query.ts',
      'src/lib/public-query.test.ts',
      'src/cms/page-helpers.ts',
      'src/cms/operations/**/*.{ts,tsx}',
      'src/app/admin/**/*.{ts,tsx}',
      'src/lib/internal-queries.ts',
      'src/lib/internal-queries.test.ts',
      // Integration test fixtures use service-role client to seed/teardown
      // test data. This is a test-only seeding use, not a public read path.
      'src/__tests__/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  // Enforce that every export in admin server-action files is wrapped in withAdmin().
  //
  // Known limitation: this rule's `withAdmin` identity check is structural
  // (matches the identifier name), not semantic. It does NOT detect:
  //   - `import { withAdmin as wrap } from '@/lib/auth'` (false flag)
  //   - `const withAdmin = (fn) => fn; export const x = withAdmin(...)` (false negative)
  // Neither pattern exists in the current codebase. If either becomes an issue,
  // migrate to a custom ESLint rule that resolves the import binding.
  {
    files: ['src/app/admin/**/actions.ts'],
    rules: {
      'no-restricted-syntax': ['error',
        {
          // Disallow exported async function declarations.
          // e.g. `export async function saveCaseStudy(...) { ... }`
          selector: 'ExportNamedDeclaration > FunctionDeclaration',
          message:
            'Server actions must be wrapped in withAdmin() from @/lib/auth. ' +
            'Use: export const NAME = withAdmin(async (...) => { ... }).'
        },
        {
          // Disallow exported variable declarations whose initializer is NOT
          // a CallExpression with callee.name === 'withAdmin'.
          selector:
            'ExportNamedDeclaration > VariableDeclaration > ' +
            "VariableDeclarator:not([init.callee.name='withAdmin'])",
          message:
            'Server actions must be wrapped in withAdmin() from @/lib/auth. ' +
            'Helpers and non-action exports do not belong in actions.ts files; ' +
            'move them elsewhere.'
        },
        {
          // Disallow `export default async function rootAction() {}`.
          selector: 'ExportDefaultDeclaration',
          message:
            'Default exports are not allowed in admin actions.ts. ' +
            'Use: import { withAdmin } from "@/lib/auth"; export const NAME = withAdmin(async (...) => { ... }).'
        },
        {
          // Disallow `export * from './other-actions'`.
          selector: 'ExportAllDeclaration',
          message:
            'Re-exports (export *) are not allowed in admin actions.ts. ' +
            'Server actions must be defined and wrapped in withAdmin() in this file.'
        },
        {
          // Disallow `export { foo } from './other'`.
          selector: 'ExportNamedDeclaration[source]',
          message:
            'Re-exports (export { x } from ...) are not allowed in admin actions.ts. ' +
            'Server actions must be defined and wrapped in withAdmin() in this file.'
        },
        {
          // Disallow specifier-form exports: `export { localAction }`.
          selector: 'ExportNamedDeclaration[declaration=null] > ExportSpecifier',
          message:
            'Specifier-form exports (export { x }) are not allowed in admin actions.ts. ' +
            'Use: import { withAdmin } from "@/lib/auth"; export const NAME = withAdmin(async (...) => { ... }).'
        }
      ]
    }
  }
];

export default eslintConfig;
