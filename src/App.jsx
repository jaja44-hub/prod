import React from 'react'

export default function App() {
  return (
    <div style={{fontFamily:'sans-serif',padding:24}}>
      <h1>Addis Crown — Production (minimal)</h1>
      <p>This is the production-only scaffold. It is intentionally minimal and ready for
      incremental additions from engineering repos as needed.</p>
      <section>
        <h2>Resources</h2>
        <ul>
          <li>Seed script: <code>seed.js</code></li>
          <li>Service account writer: <code>scripts/write-service-account.mjs</code></li>
          <li>Production config &amp; envs: set <code>FIREBASE_SERVICE_ACCOUNT</code> in Vercel</li>
        </ul>
      </section>
    </div>
  )
}
