import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Link, useLocation, Outlet } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';

import Landing from './pages/Landing';
import Diagnostic from './pages/Diagnostic';
import Results from './pages/Results';
import LearningPath from './pages/LearningPath';
import Sandbox from './pages/Sandbox';

/* ─── IntersectionObserver for .reveal elements ─────────────── */
function useRevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

/* ─── Scroll-Aware Navbar ───────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/diagnostic', label: 'Diagnostic' },
    { to: '/results', label: 'Results' },
    { to: '/learning-path', label: 'Learning Path' },
    { to: '/sandbox', label: 'Sandbox' },
  ];

  return (
    <nav className={`nav-bar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container-main flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #00f5d4, #22c55e)' }}>
            <span className="text-[var(--color-abyss)] text-xs" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>SP</span>
          </div>
          <span className="text-[15px] text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>
            Skill<span className="gradient-text">Print</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden flex flex-col gap-1 cursor-pointer bg-transparent border-none p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-[2px] bg-[var(--color-text)] transition-transform duration-200 ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
          <span className={`block w-5 h-[2px] bg-[var(--color-text)] transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[2px] bg-[var(--color-text)] transition-transform duration-200 ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--color-abyss-card)] border-b border-[var(--color-abyss-border)] p-4 flex flex-col gap-3"
             style={{ backdropFilter: 'blur(16px)' }}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link text-base py-2 ${location.pathname === item.to ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Layout Wrapper ────────────────────────────────────────── */
function Layout() {
  useRevealObserver();
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

/* ─── Wake-up ping ──────────────────────────────────────────── */
function WakeUpPing() {
  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    if (BASE_URL) fetch(`${BASE_URL}/health`).catch(() => {});
  }, []);
  return null;
}

/* ─── Router ────────────────────────────────────────────────── */
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/diagnostic', element: <Diagnostic /> },
      { path: '/results', element: <Results /> },
      { path: '/learning-path', element: <LearningPath /> },
      { path: '/sandbox', element: <Sandbox /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WakeUpPing />
    <RouterProvider router={router} />
  </React.StrictMode>
);
