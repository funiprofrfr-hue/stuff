# Baby Chair Gang website

Static page (index.html) + one Netlify Function (/api/stats) + a Netlify Database (Postgres).

## Deploy
1. Push this folder to a GitHub repo.
2. In Netlify: Add new site > Import an existing project > pick the repo. (Build command: leave empty. Publish directory: `.`)
3. Netlify installs `@netlify/database` from package.json, provisions the database and applies the SQL in
   `netlify/database/migrations/` on deploy.
4. Open the site and click Join. The numbers are shared by everyone.

## Test locally
    npm install
    npx netlify dev

## Notes
- Netlify's database tooling is new. If the migration folder or file naming differs from what Netlify expects,
  check the Netlify Database docs; the SQL in 0001_init.sql is plain Postgres and can also be run by hand.
- "One join per person" uses a random ID saved in the visitor's browser plus a cap of 5 joins per IP address
  (change MAX_JOINS_PER_IP in netlify/functions/stats.mjs). Clearing site data or switching devices gets a new ID.
- Anyone who knows the URL can send extra "click" requests directly, so treat the click count as for fun.
