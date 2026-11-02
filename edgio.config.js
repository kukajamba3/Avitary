// Current Edgio (formerly Layer0) configuration.
module.exports = {
  connector: '@edgio/next',
  name: 'avitary',
  routes: 'routes.ts',
  next: {
    // Project artwork is served from Supabase Storage; cache public HTML and static assets at the edge.
    disableImageOptimizer: true,
    disableServiceWorker: true,
    proxyToServerlessByDefault: true,
  },
};
