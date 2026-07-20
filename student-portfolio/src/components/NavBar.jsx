import { NavLink } from 'react-router-dom';

const ROUTES = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
];

function NavBar({ theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      {ROUTES.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {label}
        </NavLink>
      ))}
      <button className="theme-toggle" onClick={onToggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </nav>
  );
}

export default NavBar;