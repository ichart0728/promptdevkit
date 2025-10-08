export default function TeamManagementPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Team Management</h1>
        <p className="text-sm text-muted-foreground">
          Organize roles, invitations, and workspace permissions for your collaborators.
        </p>
      </header>
      <div className="rounded-xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        This area will soon let you configure team members, assign roles, and review pending invites.
      </div>
    </section>
  );
}
