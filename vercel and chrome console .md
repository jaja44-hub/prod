02:12:01.758 Running build in Washington, D.C., USA (East) – iad1
02:12:01.758 Build machine configuration: 2 cores, 8 GB
02:12:01.772 Cloning github.com/jaja44-hub/prod (Branch: main, Commit: a60a61a)
02:12:01.773 Skipping build cache, deployment was triggered without cache.
02:12:19.479 Cloning completed: 17.707s
02:12:23.437 Found .vercelignore
02:12:26.856 Removed 47943 ignored files defined in .vercelignore
02:12:26.856   /collected/manifest.json
02:12:26.856   /collected/scripts/check-no-engineering.mjs
02:12:26.856   /collected/scripts/write-service-account.mjs
02:12:26.856   /collected/seed.js
02:12:26.857   /comprehensive-gap-analysis.mjs
02:12:26.857   /extract-demo-credentials.mjs
02:12:26.857   /install_modules.mjs
02:12:26.857   /odoo-backend/.github/ISSUE_TEMPLATE/1_bug_form.yml
02:12:26.857   /odoo-backend/.github/ISSUE_TEMPLATE/config.yml
02:12:26.857   /odoo-backend/.github/PULL_REQUEST_TEMPLATE.md
02:12:27.304 Running "vercel build"
02:12:27.382 Vercel CLI 56.4.0
02:12:28.270 Running "install" command: `npm install`...
02:12:34.153 npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
02:12:35.069 npm warn deprecated uuid@9.0.1: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
02:12:38.112 npm warn deprecated recharts@2.15.4: 1.x and 2.x branches are no longer active. Bump to Recharts v3 to receive latest features and bugfixes. See https://github.com/recharts/recharts/wiki/3.0-migration-guide
02:12:45.905 
02:12:45.906 added 533 packages, and audited 677 packages in 18s
02:12:45.906 
02:12:45.906 88 packages are looking for funding
02:12:45.907   run `npm fund` for details
02:12:45.928 
02:12:45.928 16 vulnerabilities (11 moderate, 3 high, 2 critical)
02:12:45.930 
02:12:45.930 To address issues that do not require attention, run:
02:12:45.930   npm audit fix
02:12:45.931 
02:12:45.936 To address all issues (including breaking changes), run:
02:12:45.936   npm audit fix --force
02:12:45.936 
02:12:45.936 Run `npm audit` for details.
02:12:46.272 
02:12:46.272 > addis-crown-production@1.0.0 vercel-build
02:12:46.272 > node ./scripts/write-service-account.mjs || true && vite build
02:12:46.272 
02:12:46.305 node:internal/modules/cjs/loader:1479
02:12:46.305   throw err;
02:12:46.305   ^
02:12:46.306 
02:12:46.306 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:12:46.306     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:12:46.306     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:12:46.306     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:12:46.306     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:12:46.306     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:12:46.306     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:12:46.306     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:12:46.306     at node:internal/main/run_main_module:33:47 {
02:12:46.306   code: 'MODULE_NOT_FOUND',
02:12:46.306   requireStack: []
02:12:46.306 }
02:12:46.306 
02:12:46.306 Node.js v24.15.0
02:12:46.538 vite v8.0.16 building client environment for production...
02:12:48.677 
transforming...✓ 2672 modules transformed.
02:12:48.912 rendering chunks...
02:12:49.476 computing gzip size...
02:12:49.546 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:12:49.547 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:12:49.547 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:12:49.548 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:12:49.548 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:12:49.549 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:12:49.551 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:12:49.552 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:12:49.552 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:12:49.552 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:12:49.552 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:12:49.552 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:12:49.552 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:12:49.552 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:12:49.552 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:12:49.552 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:12:49.552 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:12:49.552 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:12:49.553 
02:12:49.554 ✓ built in 3.01s
02:12:49.554 [plugin builtin:vite-reporter] 
02:12:49.554 (!) Some chunks are larger than 500 kB after minification. Consider:
02:12:49.555 - Using dynamic import() to code-split the application
02:12:49.555 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:12:49.555 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:12:49.704 Installing dependencies...
02:12:50.955 
02:12:50.955 up to date in 1s
02:12:50.956 
02:12:50.956 88 packages are looking for funding
02:12:50.956   run `npm fund` for details
02:12:50.973 Running "npm run vercel-build"
02:12:51.089 
02:12:51.090 > addis-crown-production@1.0.0 vercel-build
02:12:51.090 > node ./scripts/write-service-account.mjs || true && vite build
02:12:51.090 
02:12:51.122 node:internal/modules/cjs/loader:1479
02:12:51.123   throw err;
02:12:51.123   ^
02:12:51.123 
02:12:51.125 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:12:51.125     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:12:51.125     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:12:51.125     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:12:51.127     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:12:51.127     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:12:51.127     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:12:51.133     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:12:51.133     at node:internal/main/run_main_module:33:47 {
02:12:51.133   code: 'MODULE_NOT_FOUND',
02:12:51.133   requireStack: []
02:12:51.133 }
02:12:51.133 
02:12:51.133 Node.js v24.15.0
02:12:51.331 vite v8.0.16 building client environment for production...
02:12:53.448 
transforming...✓ 2672 modules transformed.
02:12:53.681 rendering chunks...
02:12:54.329 computing gzip size...
02:12:54.392 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:12:54.392 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:12:54.393 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:12:54.395 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:12:54.396 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:12:54.397 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:12:54.398 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:12:54.398 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:12:54.398 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:12:54.398 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:12:54.399 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:12:54.400 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:12:54.400 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:12:54.401 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:12:54.401 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:12:54.410 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:12:54.410 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:12:54.410 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:12:54.410 
02:12:54.411 ✓ built in 3.06s
02:12:54.411 [plugin builtin:vite-reporter] 
02:12:54.411 (!) Some chunks are larger than 500 kB after minification. Consider:
02:12:54.411 - Using dynamic import() to code-split the application
02:12:54.411 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:12:54.411 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:12:55.179 Running "npm run vercel-build"
02:12:55.284 
02:12:55.285 > addis-crown-production@1.0.0 vercel-build
02:12:55.285 > node ./scripts/write-service-account.mjs || true && vite build
02:12:55.286 
02:12:55.317 node:internal/modules/cjs/loader:1479
02:12:55.318   throw err;
02:12:55.318   ^
02:12:55.318 
02:12:55.318 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:12:55.318     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:12:55.318     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:12:55.318     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:12:55.318     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:12:55.319     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:12:55.319     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:12:55.319     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:12:55.319     at node:internal/main/run_main_module:33:47 {
02:12:55.319   code: 'MODULE_NOT_FOUND',
02:12:55.319   requireStack: []
02:12:55.319 }
02:12:55.319 
02:12:55.319 Node.js v24.15.0
02:12:55.503 vite v8.0.16 building client environment for production...
02:12:57.293 
transforming...✓ 2672 modules transformed.
02:12:57.498 rendering chunks...
02:12:58.007 computing gzip size...
02:12:58.043 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:12:58.043 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:12:58.043 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:12:58.044 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:12:58.044 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:12:58.044 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:12:58.044 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:12:58.045 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:12:58.045 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:12:58.045 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:12:58.045 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:12:58.046 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:12:58.046 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:12:58.046 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:12:58.046 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:12:58.046 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:12:58.047 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:12:58.047 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:12:58.047 
02:12:58.047 ✓ built in 2.54s
02:12:58.048 [plugin builtin:vite-reporter] 
02:12:58.048 (!) Some chunks are larger than 500 kB after minification. Consider:
02:12:58.048 - Using dynamic import() to code-split the application
02:12:58.048 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:12:58.049 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:12:58.314 Running "npm run vercel-build"
02:12:58.415 
02:12:58.415 > addis-crown-production@1.0.0 vercel-build
02:12:58.416 > node ./scripts/write-service-account.mjs || true && vite build
02:12:58.416 
02:12:58.449 node:internal/modules/cjs/loader:1479
02:12:58.449   throw err;
02:12:58.450   ^
02:12:58.450 
02:12:58.450 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:12:58.450     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:12:58.450     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:12:58.451     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:12:58.451     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:12:58.451     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:12:58.451     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:12:58.451     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:12:58.451     at node:internal/main/run_main_module:33:47 {
02:12:58.451   code: 'MODULE_NOT_FOUND',
02:12:58.451   requireStack: []
02:12:58.451 }
02:12:58.451 
02:12:58.451 Node.js v24.15.0
02:12:58.633 vite v8.0.16 building client environment for production...
02:13:00.353 
transforming...✓ 2672 modules transformed.
02:13:00.589 rendering chunks...
02:13:01.102 computing gzip size...
02:13:01.188 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:01.188 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:01.189 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:01.189 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:01.189 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:01.189 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:01.190 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:01.190 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:01.190 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:01.190 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:01.190 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:01.191 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:01.191 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:01.191 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:01.191 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:01.192 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:01.192 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:01.192 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:01.192 
02:13:01.192 ✓ built in 2.53s
02:13:01.193 [plugin builtin:vite-reporter] 
02:13:01.193 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:01.193 - Using dynamic import() to code-split the application
02:13:01.193 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:01.194 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:01.392 Running "npm run vercel-build"
02:13:01.498 
02:13:01.498 > addis-crown-production@1.0.0 vercel-build
02:13:01.498 > node ./scripts/write-service-account.mjs || true && vite build
02:13:01.499 
02:13:01.530 node:internal/modules/cjs/loader:1479
02:13:01.530   throw err;
02:13:01.531   ^
02:13:01.531 
02:13:01.531 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:01.531     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:01.531     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:01.532     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:01.532     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:01.532     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:01.532     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:01.532     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:01.532     at node:internal/main/run_main_module:33:47 {
02:13:01.532   code: 'MODULE_NOT_FOUND',
02:13:01.533   requireStack: []
02:13:01.533 }
02:13:01.533 
02:13:01.533 Node.js v24.15.0
02:13:01.718 vite v8.0.16 building client environment for production...
02:13:03.642 
transforming...✓ 2672 modules transformed.
02:13:03.859 rendering chunks...
02:13:04.374 computing gzip size...
02:13:04.412 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:04.413 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:04.413 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:04.414 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:04.414 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:04.414 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:04.414 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:04.414 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:04.415 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:04.415 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:04.415 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:04.415 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:04.415 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:04.416 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:04.416 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:04.416 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:04.416 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:04.416 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:04.417 
02:13:04.417 ✓ built in 2.70s
02:13:04.417 [plugin builtin:vite-reporter] 
02:13:04.417 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:04.418 - Using dynamic import() to code-split the application
02:13:04.418 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:04.419 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:04.645 Running "npm run vercel-build"
02:13:04.747 
02:13:04.748 > addis-crown-production@1.0.0 vercel-build
02:13:04.748 > node ./scripts/write-service-account.mjs || true && vite build
02:13:04.749 
02:13:04.779 node:internal/modules/cjs/loader:1479
02:13:04.780   throw err;
02:13:04.780   ^
02:13:04.780 
02:13:04.780 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:04.780     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:04.780     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:04.781     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:04.781     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:04.781     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:04.781     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:04.781     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:04.781     at node:internal/main/run_main_module:33:47 {
02:13:04.781   code: 'MODULE_NOT_FOUND',
02:13:04.781   requireStack: []
02:13:04.781 }
02:13:04.781 
02:13:04.781 Node.js v24.15.0
02:13:04.961 vite v8.0.16 building client environment for production...
02:13:06.722 
transforming...✓ 2672 modules transformed.
02:13:06.928 rendering chunks...
02:13:07.472 computing gzip size...
02:13:07.511 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:07.511 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:07.511 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:07.512 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:07.512 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:07.512 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:07.512 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:07.512 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:07.512 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:07.513 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:07.513 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:07.513 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:07.513 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:07.514 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:07.514 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:07.514 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:07.514 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:07.514 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:07.515 
02:13:07.515 [plugin builtin:vite-reporter] 
02:13:07.515 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:07.515 - Using dynamic import() to code-split the application
02:13:07.516 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:07.516 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:07.517 ✓ built in 2.55s
02:13:07.754 Running "npm run vercel-build"
02:13:07.862 
02:13:07.862 > addis-crown-production@1.0.0 vercel-build
02:13:07.863 > node ./scripts/write-service-account.mjs || true && vite build
02:13:07.863 
02:13:07.898 node:internal/modules/cjs/loader:1479
02:13:07.899   throw err;
02:13:07.899   ^
02:13:07.899 
02:13:07.899 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:07.899     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:07.899     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:07.899     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:07.899     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:07.899     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:07.899     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:07.900     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:07.900     at node:internal/main/run_main_module:33:47 {
02:13:07.900   code: 'MODULE_NOT_FOUND',
02:13:07.900   requireStack: []
02:13:07.900 }
02:13:07.901 
02:13:07.901 Node.js v24.15.0
02:13:08.082 vite v8.0.16 building client environment for production...
02:13:09.837 
transforming...✓ 2672 modules transformed.
02:13:10.041 rendering chunks...
02:13:10.623 computing gzip size...
02:13:10.652 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:10.652 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:10.652 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:10.652 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:10.652 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:10.652 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:10.652 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:10.653 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:10.653 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:10.653 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:10.653 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:10.654 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:10.654 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:10.654 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:10.654 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:10.655 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:10.655 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:10.655 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:10.656 
02:13:10.656 ✓ built in 2.57s
02:13:10.656 [plugin builtin:vite-reporter] 
02:13:10.657 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:10.657 - Using dynamic import() to code-split the application
02:13:10.657 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:10.658 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:15.041 Running "npm run vercel-build"
02:13:15.173 
02:13:15.174 > addis-crown-production@1.0.0 vercel-build
02:13:15.174 > node ./scripts/write-service-account.mjs || true && vite build
02:13:15.175 
02:13:15.206 node:internal/modules/cjs/loader:1479
02:13:15.207   throw err;
02:13:15.207   ^
02:13:15.207 
02:13:15.207 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:15.208     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:15.208     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:15.208     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:15.208     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:15.208     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:15.208     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:15.209     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:15.209     at node:internal/main/run_main_module:33:47 {
02:13:15.209   code: 'MODULE_NOT_FOUND',
02:13:15.209   requireStack: []
02:13:15.209 }
02:13:15.209 
02:13:15.209 Node.js v24.15.0
02:13:15.394 vite v8.0.16 building client environment for production...
02:13:17.471 
transforming...✓ 2672 modules transformed.
02:13:17.693 rendering chunks...
02:13:18.204 computing gzip size...
02:13:18.240 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:18.240 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:18.241 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:18.241 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:18.241 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:18.241 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:18.242 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:18.242 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:18.242 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:18.242 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:18.242 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:18.243 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:18.243 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:18.243 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:18.243 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:18.243 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:18.244 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:18.244 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:18.244 
02:13:18.245 ✓ built in 2.85s
02:13:18.245 [plugin builtin:vite-reporter] 
02:13:18.245 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:18.245 - Using dynamic import() to code-split the application
02:13:18.246 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:18.246 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:18.422 Running "npm run vercel-build"
02:13:18.527 
02:13:18.528 > addis-crown-production@1.0.0 vercel-build
02:13:18.528 > node ./scripts/write-service-account.mjs || true && vite build
02:13:18.528 
02:13:18.560 node:internal/modules/cjs/loader:1479
02:13:18.560   throw err;
02:13:18.560   ^
02:13:18.560 
02:13:18.561 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:18.561     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:18.561     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:18.561     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:18.561     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:18.561     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:18.561     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:18.562     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:18.562     at node:internal/main/run_main_module:33:47 {
02:13:18.562   code: 'MODULE_NOT_FOUND',
02:13:18.562   requireStack: []
02:13:18.563 }
02:13:18.563 
02:13:18.563 Node.js v24.15.0
02:13:18.746 vite v8.0.16 building client environment for production...
02:13:20.538 
transforming...✓ 2672 modules transformed.
02:13:20.741 rendering chunks...
02:13:21.261 computing gzip size...
02:13:21.298 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:21.298 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:21.299 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:21.299 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:21.299 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:21.300 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:21.300 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:21.300 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:21.301 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:21.301 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:21.301 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:21.301 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:21.302 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:21.302 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:21.302 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:21.302 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:21.303 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:21.303 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:21.303 
02:13:21.304 ✓ built in 2.55s
02:13:21.304 [plugin builtin:vite-reporter] 
02:13:21.304 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:21.305 - Using dynamic import() to code-split the application
02:13:21.305 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:21.305 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:21.510 Running "npm run vercel-build"
02:13:21.626 
02:13:21.627 > addis-crown-production@1.0.0 vercel-build
02:13:21.627 > node ./scripts/write-service-account.mjs || true && vite build
02:13:21.627 
02:13:21.659 node:internal/modules/cjs/loader:1479
02:13:21.660   throw err;
02:13:21.660   ^
02:13:21.660 
02:13:21.660 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:21.660     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:21.660     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:21.661     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:21.661     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:21.661     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:21.661     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:21.661     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:21.661     at node:internal/main/run_main_module:33:47 {
02:13:21.661   code: 'MODULE_NOT_FOUND',
02:13:21.662   requireStack: []
02:13:21.662 }
02:13:21.662 
02:13:21.662 Node.js v24.15.0
02:13:21.846 vite v8.0.16 building client environment for production...
02:13:23.648 
transforming...✓ 2672 modules transformed.
02:13:23.844 rendering chunks...
02:13:24.356 computing gzip size...
02:13:24.391 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:24.391 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:24.392 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:24.392 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:24.392 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:24.392 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:24.392 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:24.392 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:24.392 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:24.393 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:24.393 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:24.393 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:24.393 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:24.393 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:24.393 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:24.394 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:24.394 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:24.394 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:24.394 
02:13:24.395 [plugin builtin:vite-reporter] 
02:13:24.395 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:24.395 - Using dynamic import() to code-split the application
02:13:24.395 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:24.395 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:24.396 ✓ built in 2.55s
02:13:24.455 Running "npm run vercel-build"
02:13:24.559 
02:13:24.559 > addis-crown-production@1.0.0 vercel-build
02:13:24.559 > node ./scripts/write-service-account.mjs || true && vite build
02:13:24.560 
02:13:24.592 node:internal/modules/cjs/loader:1479
02:13:24.592   throw err;
02:13:24.593   ^
02:13:24.593 
02:13:24.593 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:24.593     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:24.593     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:24.593     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:24.593     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:24.593     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:24.593     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:24.593     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:24.593     at node:internal/main/run_main_module:33:47 {
02:13:24.593   code: 'MODULE_NOT_FOUND',
02:13:24.593   requireStack: []
02:13:24.593 }
02:13:24.593 
02:13:24.593 Node.js v24.15.0
02:13:24.782 vite v8.0.16 building client environment for production...
02:13:26.517 
transforming...✓ 2672 modules transformed.
02:13:26.720 rendering chunks...
02:13:27.256 computing gzip size...
02:13:27.285 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:27.285 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:27.286 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:27.286 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:27.286 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:27.286 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:27.286 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:27.287 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:27.287 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:27.287 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:27.287 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:27.287 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:27.288 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:27.288 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:27.288 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:27.288 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:27.288 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:27.289 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:27.289 
02:13:27.289 ✓ built in 2.51s
02:13:27.290 [plugin builtin:vite-reporter] 
02:13:27.290 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:27.290 - Using dynamic import() to code-split the application
02:13:27.291 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:27.292 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:27.450 Running "npm run vercel-build"
02:13:27.562 
02:13:27.562 > addis-crown-production@1.0.0 vercel-build
02:13:27.562 > node ./scripts/write-service-account.mjs || true && vite build
02:13:27.562 
02:13:27.599 node:internal/modules/cjs/loader:1479
02:13:27.599   throw err;
02:13:27.600   ^
02:13:27.600 
02:13:27.600 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:27.600     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:27.600     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:27.600     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:27.600     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:27.600     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:27.600     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:27.601     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:27.601     at node:internal/main/run_main_module:33:47 {
02:13:27.601   code: 'MODULE_NOT_FOUND',
02:13:27.601   requireStack: []
02:13:27.601 }
02:13:27.601 
02:13:27.601 Node.js v24.15.0
02:13:27.794 vite v8.0.16 building client environment for production...
02:13:29.592 
transforming...✓ 2672 modules transformed.
02:13:29.796 rendering chunks...
02:13:30.309 computing gzip size...
02:13:30.354 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:30.355 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:30.355 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:30.355 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:30.356 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:30.356 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:30.356 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:30.356 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:30.356 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:30.356 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:30.356 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:30.356 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:30.356 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:30.357 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:30.357 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:30.357 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:30.357 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:30.357 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:30.357 
02:13:30.361 [plugin builtin:vite-reporter] 
02:13:30.361 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:30.361 - Using dynamic import() to code-split the application
02:13:30.361 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:30.361 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:30.362 ✓ built in 2.57s
02:13:30.570 Running "npm run vercel-build"
02:13:30.675 
02:13:30.676 > addis-crown-production@1.0.0 vercel-build
02:13:30.676 > node ./scripts/write-service-account.mjs || true && vite build
02:13:30.676 
02:13:30.708 node:internal/modules/cjs/loader:1479
02:13:30.708   throw err;
02:13:30.709   ^
02:13:30.709 
02:13:30.709 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:30.709     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:30.709     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:30.709     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:30.710     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:30.710     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:30.710     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:30.710     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:30.710     at node:internal/main/run_main_module:33:47 {
02:13:30.710   code: 'MODULE_NOT_FOUND',
02:13:30.711   requireStack: []
02:13:30.711 }
02:13:30.711 
02:13:30.711 Node.js v24.15.0
02:13:30.897 vite v8.0.16 building client environment for production...
02:13:32.733 
transforming...✓ 2672 modules transformed.
02:13:32.944 rendering chunks...
02:13:33.480 computing gzip size...
02:13:33.515 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:33.516 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:33.516 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:33.517 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:33.517 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:33.517 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:33.518 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:33.518 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:33.518 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:33.519 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:33.519 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:33.520 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:33.520 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:33.520 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:33.520 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:33.521 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:33.521 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:33.521 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:33.521 
02:13:33.522 ✓ built in 2.62s
02:13:33.522 [plugin builtin:vite-reporter] 
02:13:33.522 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:33.523 - Using dynamic import() to code-split the application
02:13:33.523 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:33.523 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:33.726 Running "npm run vercel-build"
02:13:33.834 
02:13:33.834 > addis-crown-production@1.0.0 vercel-build
02:13:33.835 > node ./scripts/write-service-account.mjs || true && vite build
02:13:33.835 
02:13:33.867 node:internal/modules/cjs/loader:1479
02:13:33.867   throw err;
02:13:33.868   ^
02:13:33.868 
02:13:33.868 Error: Cannot find module '/vercel/path0/scripts/write-service-account.mjs'
02:13:33.868     at Module._resolveFilename (node:internal/modules/cjs/loader:1476:15)
02:13:33.868     at wrapResolveFilename (node:internal/modules/cjs/loader:1049:27)
02:13:33.869     at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1073:10)
02:13:33.869     at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1094:12)
02:13:33.869     at Module._load (node:internal/modules/cjs/loader:1262:25)
02:13:33.869     at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
02:13:33.869     at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
02:13:33.869     at node:internal/main/run_main_module:33:47 {
02:13:33.869   code: 'MODULE_NOT_FOUND',
02:13:33.869   requireStack: []
02:13:33.870 }
02:13:33.870 
02:13:33.870 Node.js v24.15.0
02:13:34.058 vite v8.0.16 building client environment for production...
02:13:35.814 
transforming...✓ 2672 modules transformed.
02:13:36.020 rendering chunks...
02:13:36.572 computing gzip size...
02:13:36.599 dist/index.html                                0.79 kB │ gzip:   0.37 kB
02:13:36.600 dist/assets/index-BGJe6d5i.css                82.09 kB │ gzip:  13.21 kB
02:13:36.600 dist/assets/axios-594xYLRz.js                  0.06 kB │ gzip:   0.07 kB
02:13:36.600 dist/assets/apiClient-DJuiDLNQ.js              0.07 kB │ gzip:   0.07 kB
02:13:36.602 dist/assets/typeof-B5XbjTb1.js                 0.27 kB │ gzip:   0.16 kB
02:13:36.602 dist/assets/settlementOracle-CCPBCkXO.js       0.32 kB │ gzip:   0.26 kB
02:13:36.603 dist/assets/legalCommerceStub-Bq59GDBI.js      0.45 kB │ gzip:   0.34 kB
02:13:36.603 dist/assets/gibiSalesStub-D0_EFMyA.js          0.47 kB │ gzip:   0.32 kB
02:13:36.603 dist/assets/chunk-Cyuzqnbw.js                  0.82 kB │ gzip:   0.47 kB
02:13:36.603 dist/assets/ServiceGateway-BXDDDf2P.js         1.63 kB │ gzip:   0.73 kB
02:13:36.603 dist/assets/apiClient-DvCApP5U.js              5.02 kB │ gzip:   1.83 kB
02:13:36.603 dist/assets/purify-BwzKczXi.js                20.78 kB │ gzip:   8.66 kB
02:13:36.603 dist/assets/axios-CJnZj_Z6.js                 44.44 kB │ gzip:  17.03 kB
02:13:36.603 dist/assets/ajv-DIV1_F-P.js                  112.51 kB │ gzip:  33.48 kB
02:13:36.603 dist/assets/index.es-CGHMx63z.js             151.41 kB │ gzip:  48.89 kB
02:13:36.603 dist/assets/html2canvas-B4tp5cwC.js          199.56 kB │ gzip:  46.78 kB
02:13:36.603 dist/assets/ServiceGateway-G7v1Oh2U.js       593.87 kB │ gzip: 174.75 kB
02:13:36.603 dist/assets/index-Bv8Tz9JT.js              1,493.64 kB │ gzip: 431.96 kB
02:13:36.603 
02:13:36.603 ✓ built in 2.54s
02:13:36.603 [plugin builtin:vite-reporter] 
02:13:36.603 (!) Some chunks are larger than 500 kB after minification. Consider:
02:13:36.603 - Using dynamic import() to code-split the application
02:13:36.604 - Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
02:13:36.604 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
02:13:36.847 Build Completed in /vercel/output [1m]
02:13:37.249 Deploying outputs...