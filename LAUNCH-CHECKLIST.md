# Floscar Vanguard Launch Checklist

## Before GitHub Push

1. Confirm `.env` is not committed.
2. Confirm `data/users.json` and `data/sessions.json` are not committed.
3. Confirm `node_modules` is not committed.
4. Confirm local testing still works with `npm start`.
5. Confirm a GitHub remote is configured with `git remote -v`.

## Before Hosting

1. Set `COOKIE_SECURE=true`.
2. Set a strong `PASSWORD_PEPPER`.
3. Use persistent storage and set `DATA_DIR` to the mounted path.
4. Verify `/api/health` returns `ok: true`.

## After First Deploy

1. Open the public homepage.
2. Open the login page.
3. Register a test account.
4. Log out and log back in.
5. Save a profile update.
6. Open the Tools page and confirm tool packet history works.
7. Open the Trends page and confirm trend snapshot history works.
8. Confirm `www` and root domain both resolve correctly.
9. Confirm HTTPS is enabled and there are no mixed-content errors.

## After Domain Setup

1. Set `www.floscarvanguard.com` as the canonical public domain.
2. Redirect `floscarvanguard.com` to `www.floscarvanguard.com` in the host dashboard.
3. Re-test login and authenticated actions over the final domain.

## Search Visibility

1. Serve `robots.txt` successfully from the live domain.
2. Serve `sitemap.xml` successfully from the live domain.
3. Submit `https://www.floscarvanguard.com/sitemap.xml` to Google Search Console after launch.


## Next Production Upgrades

1. Move users and sessions to a database.
2. Add password reset.
3. Add email verification.
4. Add backups and structured logs.
