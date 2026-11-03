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

- Start with A and B; **Add matrix** appends another matrix with no fixed count limit. There is no dedicated C slot. Existing saved C work migrates to an additional matrix, while unused empty C slots are omitted.
- All matrices have the same **Include**, maximum order (1–100), coefficient rule, previous-orders toggle, and function/series previews. The final result adds every included series. At least one must be included. Remove a matrix with its trash button; Undo restores the most recently removed matrix until reload or project switch.
- Shared dimensions range from 1 × 1 to 25 × 25. Resizing and pasting retain overlapping values and names across every matrix. Paste accepts comma, space, semicolon, or tab separators and one row per line.
- Edit a row or column name to rename that item on both axes across all matrices and results.
- Enter moves left to right, then down; Shift+Enter moves back. Clicking a cell or order selects its value for replacement. Editing a cell shows its stored decimal/scientific value; leaving it applies the display format.
- Coefficient rules support `n`, numbers, parentheses, `+`, `-`, `*`, `/`, and `^`. Example: `1/(2^n)` gives Aⁿ / 2ⁿ. Include previous orders sums f(k)Aᵏ from k = 1 through n. Otherwise only f(n)Aⁿ is computed.
- Number format offers decimal, fraction, and scientific notation. Each format remembers its own precision, from 0 to 12 decimal places. Fraction mode defaults to exact; selecting a place count rounds before reducing the fraction. These are display settings: calculation and ranking retain exact rational values.
- Expand any input or result for a large view. Input matrices remain editable and results are read-only. Copy values, CSV, and PNG include shared labels and use the selected display precision. PNG includes off-screen cells. Browser fullscreen is optional; Escape or Close returns to the workspace.
- Final rankings use exact row totals, highest first. Equal totals share competition rank (1, 1, 3); tied rows retain original order. Rankings include every row and can be exported separately.
- Each project has a trash icon in the sidebar. Confirming removes it locally and, when signed in, from Supabase. Undo delete restores its saved matrices and settings. A failed cloud delete keeps the local project. Autosaves and deletes are serialized to prevent old saves from restoring deleted rows. Deleting the last project opens a blank project.
- The sidebar can be collapsed from its header or the workspace toolbar. Its desktop preference survives reload. On mobile it opens as a dismissible drawer.

Calculations use Fraction.js rational arithmetic, independent of display rounding. Decimal input is interpreted as the decimal represented by the stored numeric value. Irrational coefficient results are rejected with an explanation. Scalar rule exponents are limited to ±10,000; matrix orders remain 1–100. All input matrices, shared names, per-series controls, and per-format precision settings save with the project. Results are recomputed with Calculate.

## Validation

`npm test` covers arithmetic, exact ranking, legacy migration, dynamic collections, resizing, number formatting (including scientific carry and values beyond floating-point range), precision-independent rankings, and exports. Browser checks exercise sidebar collapse, dynamic matrix editing, matching operation controls, formats and independent precision settings, navigation, exports, removal/undo, persistence, and responsive layout. Live Supabase authentication and remote persistence still require project configuration and are not validated against a deployed backend here.
