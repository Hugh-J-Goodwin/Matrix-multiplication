# Dominant

A responsive dark-mode matrix workspace built with React and Vite. Work locally without an account, or connect Supabase for email/password login and debounced automatic cloud saves.

## Develop

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Use the existing checkout; a separate worktree is not required. `npm test` runs calculation tests, and `npm run build` produces `dist/`.

## Supabase setup

1. Create a Supabase project. Execute `supabase/schema.sql` in its SQL editor. This creates the projects table and enables row-level security so authenticated users can only access their own rows.
2. Enable email/password authentication. Set the Supabase Auth Site URL to your deployed Vercel origin. Configure email confirmation as appropriate for your project.
3. Copy `.env.example` to `.env.local` for local development and provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The second variable accepts a public publishable key or legacy anon key. Never use a service-role key: Vite variables are exposed to the browser.
4. Restart Vite after changing environment variables. Create an account, confirm your email if required, and sign in.

Cloud saving is debounced by 900 ms. Projects load on login and are automatically uploaded as you edit. Local saving is immediate. Sync failures appear in the workspace and do not prevent local work. Concurrent edits to the same project use last-write-wins; this is not a collaborative editor. Before signing in on a shared browser, be aware that locally stored guest projects are uploaded into the signed-in account. Local project data remains on the device after sign-out.

## Deploy on Vercel

Import this repository into Vercel. The included `vercel.json` selects Vite, builds with `npm run build`, and serves `dist/`. Add both Supabase variables above in Vercel Project Settings → Environment Variables for your deployment environments, then deploy (or redeploy after changing variables). No custom server is required. Without Supabase configuration, the full calculation workspace works with local saving, and the account dialog explains that cloud connection is pending.

## Matrix operations

- Edit or paste square matrices up to 25 × 25. Resizing retains overlapping entries. Paste accepts spreadsheet tabs, spaces, commas, or semicolons, with one row per line. Changing dimensions while pasting clears the other matrix.
- Choose an order from 1 to 100. A power uses ordinary matrix multiplication.
- The coefficient is a scalar expression in `n`, using numbers, parentheses, `+`, `-`, `*`, `/`, and `^`. Example: `1/(2^n)` computes Aⁿ / 2ⁿ. No code evaluation is used.
- Include previous orders computes Σ f(k) Aᵏ from k = 1 through n. Otherwise only f(n) Aⁿ is computed. Set order 1 and coefficient 3 for scalar multiplication by 3.
- Enable the secondary series for a separately weighted B sum, then add the two results. Set both orders to 1 and both rules to 1 for ordinary A + B.
- Calculate shows the result and row sums. Export CSV saves the displayed result, or the current input matrix when no result is displayed.

Calculation uses JavaScript double-precision arithmetic; results display six significant digits and CSV retains underlying precision. Overflow is detected and reported. Inputs and operation settings are saved; results are recomputed with Calculate.

## Validation

Calculation tests cover powers, weighted cumulative sums, combining independent sums, 25 × 25 identity matrices, and invalid expressions. Browser smoke checks exercised calculations, secondary series, reload persistence, matrix resizing, the guide, and responsive rendering. Live Supabase authentication and remote persistence require project configuration and have not been validated against a deployed backend.
