# Agent Guidelines

Instructions for AI agents and automated workers in this repository. Follow these rules unless the user explicitly overrides them in the current task.

You should answer in english to spend less tokens.
---

## Priority

When rules conflict with a user message, **the user wins**. When rules conflict with each other, prefer this order:

1. **Type safety** — API-generated types are the contract with the backend.
2. **Project structure** — where files live and how they are imported.
3. **Ask before guessing** — propose options when unsure or when a shortcut would break the rules above.

---

## 1. API types are the source of truth

### Where types live

- Generated Supabase types here `src/app/types/supabase-extended.ts`
- local types can live inside the component files

### What agents must do

- **Always align component props, store shapes, and form state with API types** Import concrete interfaces/enums instead of duplicating field names or inventing parallel types.
- **Before adding or widening a local type**, check whether the API already exports it.
- Run `npm run types` after doing some changes to Supabase schema.
- If code, responses, or docs disagree, **do not silently patch types by hand** tell the user.

---

## 2. UI and styling — `shadcn`

### Default UI building blocks

you can suggest shadcn components to install, use the shadcn MCP or agent. Installed components are here `src/components/ui`, they can be modified so be carefully, do not update silently.

### Styling rules

- **Do not** add arbitrary Tailwind (or inline) **background or text colors** unless the user explicitly asks for custom colors or branding.
- **Do not** reinvent kit controls (e.g. custom `<input>` wrappers).
- **Avoid** Tailwind `space-x-`* and `space-y-*` for spacing between siblings. Prefer explicit layout: `flex` / `grid` with `gap-*`, or column/row helpers (`flex-col`, `grid-cols-*`). Gap is predictable and does not rely on margin hacks between arbitrary children.

### Page layout width

This project targets **internal system UIs** (admin tools, debug views, data-heavy screens). Page-level layout should **use the full available width** — do not wrap the whole page in `max-w-`*, `container`, or centered narrow columns by default.

- **Default:** top-level page wrappers stretch to 100% (`flex flex-col gap-`*, `w-full`, padding only). Tables, JSON panels, and multi-column grids should expand with the viewport.
- **Exception — local grouping only:** when you need to **group form fields** or **compose a block of related controls/output**, that **section** may constrain or arrange its own children (grid, flex, `max-w-`* on the form card, column spans, etc.) so fields stay aligned and do not “float” loosely on wide screens.

---

## 3. Project structure
> See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for a full map of all app sections and the permata project internals.

Project follows the Next.js app structure so inside `src/app/` you can find some different isolated projects/pages they can contain their own specific components here `src/app/[name]/components/`, all the specific logic component should go there. 

### Pages vs components

If you feel that the component is more agnostic, you can store it here `src/components/` - they can be related to the whole workspace. Chceck that folders before reinventing the wheel.

### URL-synced page filters

If a page has **filtering** (search fields, tabs, pagination, date ranges, toggles that affect the loaded list), prefer syncing state in the **URL query string**, not only in local `useState`.

**Rules:**

/// need to create solution ///

### Multi-file components

If a feature needs several **tightly coupled** files (component + utils + tests + types), put them in **one folder**:

```
src/app/[name]/components/campaign/
  campaign-list.tsx
  campaign-detail.tsx
  campaign-list-utils.ts
  campaign-list-utils.test.ts
```

Do not scatter the same feature across unrelated top-level files without a folder.

### Path alias

Use `@/` → `src/` (see `tsconfig.json`), e.g. `@/components/pager`

---

## 4. Imports — no barrel re-exports

- **Avoid** `index.ts` / `index.tsx` files whose only job is re-exporting siblings (`export { Foo } from './foo'`).
- Import from the **defining file**: `import { Home } from '@/components/home/home'`, not from a barrel.
- Exception: framework conventions for `src/pages/`* default exports (Canvas/Next-style page entries) are allowed; keep those files thin.


---

## 7. Commits and scope

- Match existing code style and naming in the file you edit.
- Minimize diff scope; do not refactor unrelated areas.
- **Never** create git commits, push, or PRs unless the user explicitly asks in the current task.
- Superpowers plans may include a "Commit" step — **skip it** in this repo unless the user requested a commit.
- Do not commit secrets (`.env.local`, credentials).

