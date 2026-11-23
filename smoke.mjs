const origin = process.argv[2];
if (!origin || !URL.canParse(origin)) throw new Error('Usage: node smoke.mjs https://your-salonbook-site');

async function request(path, expectedStatus = 200) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(12000), redirect: 'manual' });
  if (response.status !== expectedStatus) throw new Error(path + ': expected ' + expectedStatus + ', got ' + response.status);
  console.log(response.status, path);
  return response;
}

for (const path of ['/', '/services', '/sign-in', '/sign-up', '/payment/success', '/payment/cancel']) await request(path);
const catalog = await (await request('/api/services?sort=asc')).json();
if (!Array.isArray(catalog) || catalog.length < 6) throw new Error('Expected at least six seeded active services.');
if (catalog.some((row, i) => row.status !== 'active' || (i && row.price < catalog[i - 1].price))) {
  throw new Error('Expected only active services in ascending price order.');
}
const sample = catalog[0];
const search = new URLSearchParams({ search: sample.serviceName, category: sample.category });
const filtered = await (await request('/api/services?' + search)).json();
if (!filtered.some(row => row._id === sample._id)) throw new Error('Sample service was missing from filtered results.');
await request('/api/services/' + sample._id, 401);
await request('/api/appointments', 401);
await request('/api/admin/services', 401);
console.log('Public catalog and anonymous API access checks passed.');
