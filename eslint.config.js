// ESLint flat config. Replaces the unmaintained jshint linter that was
// previously wired into the grunt `website` task.
//
// This lints the server-side / build JavaScript. The browser client under
// src/client (vendored libraries, minified bundles, angular-era globals) is
// intentionally excluded - it is a separate concern and would only add noise.
const js = require('@eslint/js');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'deploy/**',
            'logs/**',
            'out/**',
            'workshop/**',
            'tools/**',
            'IronbaneAssets/**', // separate (gitignored) game content checkout
            'src/client/**', // browser bundles + vendored libraries
            '**/*.min.js'
        ]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                // Node.js
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
                process: 'readonly',
                console: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                setImmediate: 'readonly',
                global: 'writable',
                // Globals the game injects at runtime (see main.js / includes)
                APP_ROOT_PATH: 'readonly',
                SERVER: 'readonly',
                window: 'readonly',
                Class: 'readonly',
                _: 'readonly',
                io: 'readonly',
                ioApp: 'readonly',
                server: 'readonly',
                engine: 'readonly',
                worldHandler: 'readonly',
                chatHandler: 'readonly',
                dataHandler: 'readonly',
                actorScripts: 'readonly',
                itemService: 'readonly',
                itemTemplateService: 'readonly',
                mysql: 'readonly',
                THREE: 'readonly'
            }
        },
        rules: {
            // The legacy code predates these conventions; keep the linter
            // focused on likely-real bugs rather than style noise.
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'no-empty': 'off',
            'no-prototype-builtins': 'off',
            'no-cond-assign': 'off',
            'no-redeclare': 'off',
            'no-fallthrough': 'off',
            'no-control-regex': 'off',
            'no-useless-escape': 'off',
            'no-constant-condition': 'off',
            'no-inner-declarations': 'off',
            // Pre-existing patterns in the legacy game code. Surfaced as
            // warnings (so `npm run lint` still fails on *new* errors) rather
            // than rewriting game logic as part of a dependency upgrade.
            'no-debugger': 'warn',
            'no-unreachable': 'warn',
            'no-octal': 'warn',
            'no-extra-boolean-cast': 'warn',
            'no-unsafe-negation': 'warn',
            'no-global-assign': 'warn'
        }
    }
];
