import { Router } from '@edgio/core';
import { CustomCacheKey } from '@edgio/core/router';
import type { FeatureCreator } from '@edgio/core/router/RouteHelper';
import { nextRoutes } from '@edgio/next';

const router = new Router();
const publicPageCache: FeatureCreator = ({ cache }) => {
  cache({
    browser: { maxAgeSeconds: 0 },
    edge: { maxAgeSeconds: 300, staleWhileRevalidateSeconds: 600 },
  });
};
const catalogPageCache: FeatureCreator = ({ cache }) => {
  cache({
    key: new CustomCacheKey().excludeAllQueryParametersExcept('q', 'genre', 'year', 'type', 'age', 'status', 'sort', 'page'),
    browser: { maxAgeSeconds: 0 },
    edge: { maxAgeSeconds: 300, staleWhileRevalidateSeconds: 600 },
  });
};
const immutableAssetCache: FeatureCreator = ({ cache }) => {
  cache({
    browser: { maxAgeSeconds: 31_536_000 },
    edge: { maxAgeSeconds: 31_536_000, staleWhileRevalidateSeconds: 86_400 },
  });
};
const posterCache: FeatureCreator = ({ cache }) => {
  cache({
    browser: { maxAgeSeconds: 86_400 },
    edge: { maxAgeSeconds: 604_800, staleWhileRevalidateSeconds: 86_400 },
  });
};
const noCache: FeatureCreator = ({ cache }) => {
  cache({ browser: false, edge: false });
};

// Anonymous, public HTML only. User-specific state is fetched client-side behind Supabase RLS.
router.match('/', publicPageCache);
router.match('/catalog', catalogPageCache);
router.match('/anime/:slug', publicPageCache);

// Immutable assets are safe to cache for a year at the edge.
router.match('/_next/static/:path*', immutableAssetCache);
router.match('/posters/:path*', posterCache);

// Never cache auth, private pages, user data, or API responses.
router.match('/api/:path*', noCache);
router.match('/u/:username', noCache);
router.match('/auth/:path*', noCache);
router.match('/login', noCache);
router.match('/register', noCache);
router.match('/reset-password', noCache);
router.match('/settings', noCache);
router.match('/library', noCache);
router.match('/admin', noCache);
router.use(nextRoutes);

export default router;
