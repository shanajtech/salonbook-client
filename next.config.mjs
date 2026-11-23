const apiOrigin = (process.env.SALONBOOK_API_ORIGIN || 'http://localhost:4000').replace(/\/$/, '');

export default {
  async rewrites() {
    return {
      beforeFiles: [{ source: '/api/:path*', destination: apiOrigin + '/api/:path*' }],
      afterFiles: [],
      fallback: [],
    };
  },
};
