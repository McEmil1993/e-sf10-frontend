This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set your preferred port in `.env`:

```bash
PORT=4444
BASE_API=http://localhost:5555/api
BASE_URL=http://localhost:5555
PUPIL_ROUTE_SECRET=953a1afeaa9d4641ba07c5467ff79b95
```
Then, install node
```bash
npm i
# or
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open `http://localhost:<your-port>` with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# Frontend Steps: Add A New Page Or Module

This guide is for this frontend project only.

Current setup:

- Next.js App Router
- App source is in `src/app`
- Protected admin pages live under `src/app/(pages)/(protected)`
- Shared sidebar/topbar layout is already handled by `src/app/(pages)/(protected)/layout.tsx`
- Sidebar items are configured in `src/app/config/navItems.ts`

## 1. Decide The URL

Example target URL:

```text
/reports/summary
```

Create this file:

```text
src/app/(pages)/(protected)/reports/summary/page.tsx
```

Important:

- Folders with parentheses, like `(pages)` and `(protected)`, are route groups.
- Route groups do not appear in the URL.
- The route becomes accessible only when a `page.tsx` file exists.

## 2. Create A Simple Page

Use a Server Component if the page is mostly static.

```tsx
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";

export default function ReportsSummaryPage() {
  return (
    <PagePlaceholder
      breadcrumb="Home > Reports > Summary"
      sectionLabel="Reports"
      title="Reports Summary"
    >
      <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <p className="mt-2 text-sm text-muted">Start building this module here.</p>
      </section>
    </PagePlaceholder>
  );
}
```

## 3. Use A Client Page If Interactive

Add `"use client";` only when the page needs React state, effects, modals, form handlers, browser APIs, or click handlers.

```tsx
"use client";

import { useState } from "react";
import Button from "@/app/components/Button/Button";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";

export default function ReportsSummaryPage() {
  const [count, setCount] = useState(0);

  return (
    <PagePlaceholder
      breadcrumb="Home > Reports > Summary"
      sectionLabel="Reports"
      title="Reports Summary"
    >
      <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-slate-700">Clicked {count} times</p>
        <Button className="mt-3" onClick={() => setCount((value) => value + 1)} type="button">
          Click
        </Button>
      </section>
    </PagePlaceholder>
  );
}
```

## 4. Add Sidebar Navigation

Update:

```text
src/app/config/navItems.ts
```

Top-level item example:

```ts
{
  label: "Reports Summary",
  href: "/reports/summary",
  icon: "document",
  description: "View report summaries",
}
```

Child item under Settings example:

```ts
{
  label: "Reports Summary",
  href: "/reports/summary",
  description: "View report summaries",
}
```

If the page is not added to `navItems.ts`, it can still be opened directly by URL.

## 5. Create A Module Folder For Bigger Features

For a bigger module, keep page routing separate from feature UI.

Example:

```text
src/app/(pages)/(protected)/reports/summary/page.tsx
src/app/components/Reports/ReportsSummaryTable.tsx
src/app/types/reportTypes.ts
src/app/utils/reportsApi.ts
```

Page file:

```tsx
import ReportsSummaryTable from "@/app/components/Reports/ReportsSummaryTable";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";

export default function ReportsSummaryPage() {
  return (
    <PagePlaceholder
      breadcrumb="Home > Reports > Summary"
      sectionLabel="Reports"
      title="Reports Summary"
    >
      <ReportsSummaryTable />
    </PagePlaceholder>
  );
}
```

Component file:

```tsx
"use client";

export default function ReportsSummaryTable() {
  return (
    <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Report Data</h2>
    </section>
  );
}
```

## 6. Add Types

Create:

```text
src/app/types/reportTypes.ts
```

Example:

```ts
export type ReportSummary = {
  id: number;
  title: string;
  status: "draft" | "published";
  updated_at: string;
};
```

## 7. Add API Helper

Create:

```text
src/app/utils/reportsApi.ts
```

Example:

```ts
import type { ReportSummary } from "@/app/types/reportTypes";
import { requestAuthenticatedApi } from "@/app/utils/api";

export function listReportSummaries(token?: string) {
  return requestAuthenticatedApi<ReportSummary[]>("/reports/summary", { token });
}
```

Use it in a client component:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ReportSummary } from "@/app/types/reportTypes";
import { listReportSummaries } from "@/app/utils/reportsApi";

export default function ReportsSummaryTable() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setIsLoading(true);
        const data = await listReportSummaries();

        if (isMounted) {
          setReports(data);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
      {isLoading ? (
        <p className="text-sm text-muted">Loading reports...</p>
      ) : (
        <p className="text-sm text-slate-700">{reports.length} reports found.</p>
      )}
    </section>
  );
}
```

## 8. Use Existing Shared UI

Prefer existing components:

- `PagePlaceholder` for page wrapper/header
- `Table` for data tables
- `Button` for actions
- `FormModal` for forms
- `ConfirmModal` for delete confirmation
- `ToastViewport` for messages
- `LookupField` for searchable dropdowns

Example imports:

```tsx
import Button from "@/app/components/Button/Button";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
```

## 9. Verify

Run TypeScript:

```powershell
npx tsc --noEmit
```

Run lint on changed files:

```powershell
npx eslint src/app/(pages)/(protected)/reports/summary/page.tsx
```

If PowerShell has trouble with parentheses in paths, wrap the path in quotes:

```powershell
npx eslint 'src/app/(pages)/(protected)/reports/summary/page.tsx'
```

## 10. Run The Frontend

Use:

```powershell
npm run dev
```

Then open the local URL shown in the terminal. This project commonly uses:

```text
http://localhost:3333
```

## Quick Checklist

- Create route folder under `src/app/(pages)/(protected)`
- Add `page.tsx`
- Use `"use client";` only when needed
- Add sidebar entry in `src/app/config/navItems.ts` if needed
- Put reusable UI in `src/app/components/<ModuleName>`
- Put types in `src/app/types`
- Put API helpers in `src/app/utils`
- Run `npx tsc --noEmit`
- Run scoped `npx eslint` on changed files
