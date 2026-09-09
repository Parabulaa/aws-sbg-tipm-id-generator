# Vercel deployment

The AWS SBG TIP Manila ID Generator is deployed from the `main` branch of the
GitHub repository to Vercel.

Production URL: <https://aws-sbg-id-generator.vercel.app>

## Build configuration

- Framework preset: Vite
- Build command: `npm run build:vercel`
- Node.js: 24.x
- Production branch: `main`
- Vercel project: `aws-sbg-id-generator`

Every push to `main` should create a new production deployment through the
GitHub integration. Pull requests and other branches can be configured as
preview deployments in Vercel.

## Vercel environment variables

Production requires these variables. The publishable key is safe for client
configuration; do not add a service-role key or any other secret to the
repository.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

The `VITE_` variables are used by the browser. The server route uses the
non-`VITE_` aliases. Set the same values for Preview when preview deployments
are needed. Never commit `.env.local`.

## Supabase production auth setup

In Supabase Dashboard → Authentication → URL Configuration, set:

- Site URL: `https://aws-sbg-id-generator.vercel.app`
- Redirect URL: `https://aws-sbg-id-generator.vercel.app/**`
- Keep `http://localhost:3000/**` for local development

After saving those values, create or invite an officer account in Supabase
Authentication. The deployed login flow uses email/password Supabase Auth,
keeps the session in the browser, protects `/dashboard`, and supports logout.

## Verification checklist

```text
/          → public landing page
/login     → officer login form
/dashboard → redirects to /login when unauthenticated
```

For a local build, copy the public Supabase values into `.env.local`, then run
`npm run dev`. Production verification should use the Vercel URL above.
