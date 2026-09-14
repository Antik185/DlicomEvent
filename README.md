# Dlicom RU × Nigeria Community Tournament

The public site is served from `dist`, with a protected vote-management page at `/admin` and Vercel Functions under `api`.

## Deploy on Vercel

1. Import `Antik185/DlicomEvent` into Vercel.
2. Add a Neon Postgres integration from Vercel Marketplace. The API accepts the standard `DATABASE_URL` as well as Vercel-prefixed `Storage_DATABASE_URL` and `Storage_POSTGRES_URL` variables.
3. Add these project environment variables:
   - `ADMIN_PASSWORD`: a strong private password for `/admin`.
   - `ADMIN_SESSION_SECRET`: at least 32 random characters used to sign admin sessions.
4. Deploy. The database table is created automatically on the first request.

The public page loads current standings from `/api/standings`. An administrator can add and delete verified votes through `/admin`; vote weight is calculated on the server from the selected role.

## Local static preview

The existing lightweight preview still serves the public design, but live APIs require Vercel or `vercel dev` with the environment variables above.
