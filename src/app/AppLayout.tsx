import { Link, Outlet } from '@tanstack/react-router';
import { apiBaseUrl } from '../shared/api/client';

export function AppLayout() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Администрирование статического анализатора Verilog</h1>
          <p>API: {apiBaseUrl || 'прокси Vite -> http://localhost:8080'}</p>
        </div>
        <nav className="nav-tabs" aria-label="Основная навигация">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link nav-link-active' }}>
            Анализ
          </Link>
          <Link
            to="/rules"
            className="nav-link"
            activeProps={{ className: 'nav-link nav-link-active' }}
          >
            Правила
          </Link>
        </nav>
      </header>
      <Outlet />
    </main>
  );
}
