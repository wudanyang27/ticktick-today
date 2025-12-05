import obsidianmd from 'eslint-plugin-obsidianmd';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
    {
        ignores: ['debug-*.mjs', 'esbuild.config.mjs', 'version-bump.mjs', 'main.js', 'eslint.config.js', 'package.json'],
    },
    ...tseslint.configs.recommended,
    ...Array.from(obsidianmd.configs.recommended).map(config => {
        const newConfig = { ...config };
        delete newConfig.extends;
        return newConfig;
    }),
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "no-undef": "off",
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "args": "none"
                }
            ],
            "@typescript-eslint/ban-ts-comment": "off",
            "no-prototype-builtins": "off",
            "@typescript-eslint/no-empty-function": "off"
        }
    }
];