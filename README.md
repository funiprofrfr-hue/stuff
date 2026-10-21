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

## Admin (ranks)
1. In Netlify: Site configuration > Environment variables > add `ADMIN_PASSWORD` with a long password only you know, then redeploy.
2. Go to `/admin.html` on your site (it is not linked anywhere), log in, and tick ranks for each member. Save ranks or remove a member.
3. New members start as Member. Ranks: Founder, Captain, Head Of Military Affairs, Chief (S); Commander, Head of Planning, Head of Preparation, Head of Military Preparation, Head of Music (A); Lieutenant (B); Soldier (C); Recruit, Member (D). Use "Export members (CSV)" on the admin page to download a backup list.
4. If the migrations `0002_ranks.sql` or `0003_real_name.sql` do not run automatically, run their SQL by hand.
5. Members page: `/members.html`. Visitors see usernames and ranks; people who have joined also see real names.

## Notes
- Netlify's database tooling is new. If the migration folder or file naming differs from what Netlify expects,
  check the Netlify Database docs; the SQL in 0001_init.sql is plain Postgres and can also be run by hand.
- "One join per person" uses a random ID saved in the visitor's browser plus a cap of 5 joins per IP address
  (change MAX_JOINS_PER_IP in netlify/functions/stats.mjs). Clearing site data or switching devices gets a new ID.
- Anyone who knows the URL can send extra "click" requests directly, so treat the click count as for fun.
