# Frontend Reorg — **Based on Current Project Structure** (bsaas)

> We will NOT create a new `web-customer` lib (it already exists). We will add **`libs/web/public`** and augment the **existing** `libs/web/customer` with routes/pages. The app in `apps/web/customer` becomes a thin shell.

## What you already have (relevant bits)

```
libs/
└── web/
    ├── customer/
    │   └── auth/
    │       └── src/lib
    │           ├── components/
    │           │   ├── forgot-password/
    │           │   ├── login/
    │           │   └── register/
    │           ├── models/
    │           ├── services/
    │           └── tokens/
    ├── ui/
    ├── core/
    │   ├── auth/
    │   └── http/
    └── config/
        ├── styles/
        │   └── styles.css
        ├── environments/
        │   └── admin/
        └── tokens/
```

Locales per spec: **en, bn, hi**.

---

## End State

1) **New** `libs/web/public` for **browse/SEO** (home, city, tenant, public reviews, static docs).
2) **Existing** `libs/web/customer` gets a `customer.routes.ts` and `pages/` (profile, bookings, review compose). Keep `auth` sub-lib as-is.
3) `apps/web/customer` thin shell that **lazy‑loads** both route arrays and hosts the header/outlet.

---

## Steps

### 1) Generate ONLY the public library

```bash
nx g @nx/angular:library web-public --directory=libs/web --standalone --simpleName
```

### 2) Create the Public structure

```
libs/web/public/
└── src/lib/
    ├── public.routes.ts
    ├── pages/{home,city-salons,tenant,tenant-reviews,search}/
    ├── static/{terms,privacy,faq}/
    ├── content/{en,bn,hi}/{terms.md,privacy.md,faq.md}
    └── services/{public-data.service.ts,static-content.service.ts}
```

### 3) Augment the EXISTING customer library

```
libs/web/customer/
└── src/lib/
    ├── customer.routes.ts
    └── pages/{profile,bookings,review-compose}/
```
> Reuse `libs/web/customer/auth/src/lib/components/{login,register,forgot-password}`.

### 4) Thin app routes

```
apps/web/customer/src/app/app.routes.ts
```

```ts
export const routes: Routes = [
  { path: '', loadChildren: () => import('@beauty-saas/web/public').then(m => m.PUBLIC_ROUTES) },
  { path: '', canMatch: [authCanMatch], loadChildren: () => import('@beauty-saas/web/customer').then(m => m.CUSTOMER_ROUTES) },
  { path: '**', redirectTo: '' },
];
```

### 5) Boundaries

- `web-public` & `web-customer` may depend on: `web/ui`, `web/core`, `web/config`.
- `web-public` **must not** depend on `web-customer`.
- No lib may import from an app.

---

## Checklist

- [ ] Generate `libs/web/public`
- [ ] Create `public.routes.ts`, pages, static docs, services
- [ ] Add `customer.routes.ts` & pages to existing `libs/web/customer`
- [ ] Update `apps/web/customer/app.routes.ts`
- [ ] Verify header in `libs/web/ui` reflects auth state
- [ ] SSR + SEO: Angular Universal on app, `SeoMetaService` in `libs/web/config/seo`
- [ ] Nx dep constraints validated via `nx graph`
