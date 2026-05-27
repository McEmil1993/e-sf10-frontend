# How To Add A New Page

Guide na ito ay para sa current setup ng project na ito:

- Next.js App Router
- app code nasa `src/app`
- may route groups na `(pages)` at `(protected)`
- may shared protected layout sa `src/app/(pages)/(protected)/layout.tsx`

## Quick rules

- Ang route ay nagiging accessible lang kapag may `page.tsx`.
- Ang folders na naka-parentheses tulad ng `(pages)` at `(protected)` ay pang-organization lang at hindi kasama sa URL.
- Ang `page.tsx` ay Server Component by default.
- Maglagay lang ng `"use client";` sa taas kung kailangan ng `useState`, `useEffect`, click handlers, browser APIs, at iba pang interactive logic.

Base ito sa local Next.js docs ng project:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`

## Saan ilalagay ang bagong page

Kung gusto mong gumawa ng bagong protected page na ang URL ay:

- `/reports`

ang file path na gagawin ay:

- `src/app/(pages)/(protected)/reports/page.tsx`

Bakit ganyan ang path:

- `src/app` dahil naka-`src` folder ang app code
- `(pages)` route group lang, hindi kasama sa URL
- `(protected)` route group lang din, hindi kasama sa URL
- `reports` ang magiging actual route segment
- `page.tsx` ang file na mag-e-expose ng route

Ibig sabihin:

- file path: `src/app/(pages)/(protected)/reports/page.tsx`
- URL: `/reports`

## Step-by-step

1. Gumawa ng folder para sa route segment.

Path:

```text
src/app/(pages)/(protected)/reports
```

2. Sa loob ng folder na iyon, gumawa ng `page.tsx`.

Path:

```text
src/app/(pages)/(protected)/reports/page.tsx
```

3. Ilagay ang page component.

Kung simple/static page lang, puwedeng walang `"use client";`.

Sample:

```tsx
export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">Reports</h1>
          <p className="text-sm text-muted">Reports module</p>
        </div>
        <div className="text-sm text-muted">Home &gt; Reports</div>
      </section>

      <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
        <p className="mt-2 text-sm text-muted">
          This page is ready for reports content.
        </p>
      </section>
    </div>
  );
}
```

4. Hindi mo na kailangan gumawa ng bagong layout para dito kung gusto mo siyang sumunod sa existing protected admin shell.

Covered na ito ng:

```text
src/app/(pages)/(protected)/layout.tsx
```

5. Kung gusto mong lumabas sa sidebar/menu, i-update ang nav config.

File:

```text
src/app/config/navItems.ts
```

Sample na idadagdag:

```ts
{
  label: "Reports",
  href: "/reports",
  description: "View generated reports",
}
```

Note:

- Kung hindi mo ito idagdag sa `navItems.ts`, gumagana pa rin ang page kapag binisita ang URL nang direkta.
- Menu visibility lang ang naaapektuhan ng `navItems.ts`.

## Kailan gagamit ng "use client"

Maglagay ng:

```tsx
"use client";
```

kapag ang page ay may:

- `useState`
- `useEffect`
- form interactions
- modal open/close state
- browser-only APIs tulad ng `window` o `localStorage`

Sample client page skeleton:

```tsx
"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-4">
      <h1 className="text-[32px] font-light text-slate-900">Reports</h1>
      <button
        className="rounded border px-3 py-2"
        onClick={() => setCount((value) => value + 1)}
      >
        Clicked {count} times
      </button>
    </div>
  );
}
```

## Fast checklist

- Gumawa ng folder sa `src/app/(pages)/(protected)/<route-name>`
- Gumawa ng `page.tsx` sa loob nito
- Pangalanan ang component base sa page, halimbawa `ReportsPage`
- Gumamit lang ng `"use client";` kung interactive ang page
- I-update ang `src/app/config/navItems.ts` kung gusto mong makita sa sidebar

## Example summary

Kung gusto mo ng page na `/reports`, ito ang mga path:

- Page file: `src/app/(pages)/(protected)/reports/page.tsx`
- Optional sidebar update: `src/app/config/navItems.ts`

Walang kailangang idagdag sa:

- `src/app/(pages)/(protected)/layout.tsx`

dahil automatic na niyang wina-wrap ang lahat ng pages sa loob ng `(protected)`.
