# Saite Admin Opera-style integration package

This package is matched to the current Saite repository structure. It does not change the repository automatically.

## Files

- `src/components/admin/admin-shell.tsx`: drop-in replacement for the existing shell export.
- `src/components/admin/admin-opera-shell.tsx`: hover rail, flyout navigation, two-part in-app header, and mobile behavior.
- `src/components/admin/admin-opera-shell.module.css`: scoped styles using the existing Saite token names.
- `src/components/ui/admin-opera-tabs.tsx`: reusable All / Updates / Enabled / Disabled control.

## Why this matches the repo

- Reuses `ADMIN_NAV`, `filterAdminNavByRole`, `isAdminGroupActive`, `ADMIN_ICON_MAP`, `useAdminSessionStore`, and `roleLabel`.
- Keeps the existing protected `(panel)/layout.tsx` and route tree untouched.
- Keeps page children untouched, so existing pages such as `AdminProductsPanel` continue rendering through the shell.
- Adds no package and no API, database, or routing changes.

## Apply after approval

Copy the files into the same paths. The shell replacement is the only integration point. The tabs component can then be imported by the page-specific list that owns the filter state.
