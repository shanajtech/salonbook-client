# SalonBook client

Next.js interface for public service search, customer appointments, role dashboards and Stripe Checkout handoff.

1. Run npm ci.
2. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL to the Express origin.
3. Start the configured server, then run npm run dev and open http://localhost:3000.
4. Run npm run build to check production compilation. Run npm start to serve the production build.
5. Set NEXT_PUBLIC_API_URL before building on the hosting provider.

The live service cards come from MongoDB through the API. Add six active services using the admin dashboard. Test login, protected-route refresh, booking, admin confirmation and Stripe test-mode Checkout before submission.

Add the live site and both GitHub repository links after deployment.

## Assignment 9 handoff

- Client: https://github.com/shanajtech/salonbook-client
- Server: https://github.com/shanajtech/salonbook-server
- Assignment: https://web.programming-hero.com/web-14/assignment/web-14-assignment-9

Implemented: homepage, service filters, Better Auth forms, customer and admin dashboard screens, booking actions, service image upload UI and checkout return pages.

Still to verify: configure the server and external integrations, create six active services with salon photos, test both account roles, verify mobile and production route refresh, and test Stripe Checkout and webhook delivery. Remaining rubric gaps include footer social links and a dedicated salon banner photo. Add the live URL here after deployment. The 20 meaningful client commits and 12 meaningful server commits remain rubric targets.

