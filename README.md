# SalonBook client

Next.js, React and Better Auth interface for public service search, customer appointments, role dashboards and Stripe Checkout handoff.

1. Run npm ci.
2. Copy .env.example to .env.local and set SALONBOOK_API_ORIGIN to the Express origin.
3. Start the configured server, then run npm run dev and open http://localhost:3000. Use localhost consistently for cookies.
4. Run npm run build to check production compilation. Run npm start to serve the production build.
5. Set SALONBOOK_API_ORIGIN before building on the hosting provider.

The live service cards come from MongoDB through the API. Add six active services using the admin dashboard. Test login, protected-route refresh, booking, admin confirmation and Stripe test-mode Checkout before submission.

## Application links

- [Client repository](https://github.com/shanajtech/salonbook-client)
- [Server repository](https://github.com/shanajtech/salonbook-server)
- Public deployment pending.

## Deployment smoke check

After deploying and adding six active services, run node smoke.mjs https://your-salonbook-site.
The smoke check covers public pages, catalog search and sort, and anonymous API access.
It does not exercise sign-in, appointment transitions, or Stripe payments. Verify those manually using dedicated test accounts and Stripe test mode.
