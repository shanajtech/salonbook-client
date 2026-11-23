# SalonBook client

Next.js interface for public service search, customer appointments, role dashboards and Stripe Checkout handoff.

1. Run npm ci.
2. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL to the Express origin.
3. Start the configured server, then run npm run dev and open http://localhost:3000.
4. Run npm run build to check production compilation. Run npm start to serve the production build.
5. Set NEXT_PUBLIC_API_URL before building on the hosting provider.

The live service cards come from MongoDB through the API. Add six active services using the admin dashboard. Test login, protected-route refresh, booking, admin confirmation and Stripe test-mode Checkout before submission.

Add the live site and both GitHub repository links after deployment.

