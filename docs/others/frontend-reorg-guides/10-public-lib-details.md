# `libs/web/public` — Public Feature Library

Contains browseable pages and static info docs.

## Structure

```
libs/web/public/
└── src/lib/
    ├── public.routes.ts
    ├── pages/{home,city-salons,tenant,tenant-reviews,search}/
    ├── static/{terms,privacy,faq}/
    ├── content/{en,bn,hi}/{terms.md,privacy.md,faq.md}
    └── services/{public-data.service.ts,static-content.service.ts}
```

### Routes

```ts
export const PUBLIC_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: ':city/salons', loadComponent: () => import('./pages/city-salons/city-salons.page').then(m => m.CitySalonListPage) },
  { path: ':city/:tenantSlug', loadComponent: () => import('./pages/tenant/tenant.page').then(m => m.TenantPage) },
  { path: ':city/:tenantSlug/reviews', loadComponent: () => import('./pages/tenant-reviews/tenant-reviews.page').then(m => m.TenantReviewsPage) },
  { path: 'info/terms', loadComponent: () => import('./static/terms/terms.page').then(m => m.TermsPage) },
  { path: 'info/privacy', loadComponent: () => import('./static/privacy/privacy.page').then(m => m.PrivacyPage) },
  { path: 'info/faq', loadComponent: () => import('./static/faq/faq.page').then(m => m.FaqPage) },
];
```

### Static Docs

- `.md` under: `content/{en,bn,hi}/{terms,privacy,faq}.md`
- Load using a lightweight service or expose via lib assets.

### SEO & SSR

- Use `SeoMetaService` (place under `libs/web/config/seo`).
- Resolve tenant/city data before render for proper SSR meta.

### Dependencies

- Allowed: `web/ui`, `web/core/*`, `web/config/*`
- Forbidden: `web-customer`
