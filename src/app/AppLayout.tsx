import { Link, Outlet } from '@tanstack/react-router';
import { apiBaseUrl } from '../shared/api/client';

export function AppLayout() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Verilog Lint Admin</h1>
          <p>API: {apiBaseUrl || 'Vite proxy -> http://localhost:8080'}</p>
        </div>
        <nav className="nav-tabs" aria-label="Primary">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link nav-link-active' }}>
            Lint
          </Link>
          <Link
            to="/rules"
            className="nav-link"
            activeProps={{ className: 'nav-link nav-link-active' }}
          >
            Rules
          </Link>
        </nav>
      </header>
      <Outlet />
    </main>
  );
}
