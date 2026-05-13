export default function AppShell({ header, sidebar, preview }) {
  return (
    <div className="app-shell">
      {header}
      <div className="app-body">
        <aside className="sidebar">{sidebar}</aside>
        <main className="preview-area">{preview}</main>
      </div>
    </div>
  );
}
