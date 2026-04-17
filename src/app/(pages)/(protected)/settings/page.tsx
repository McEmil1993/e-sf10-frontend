export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">Settings</h1>
          <p className="text-sm text-muted">General account and system settings</p>
        </div>
        <div className="text-sm text-muted">Home &gt; Settings</div>
      </section>

      <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Settings Panel</h2>
        <p className="mt-2 text-sm text-muted">
          This area is reserved for general settings. Skins are managed separately in the
          sidebar under <span className="font-semibold text-slate-700">Skins</span>.
        </p>
      </section>
    </div>
  );
}
