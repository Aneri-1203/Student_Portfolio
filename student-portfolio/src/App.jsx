import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';

// Home is small and always the landing page — keep it eager
import Home from './pages/Home';

// Lazy-load all other routes so they are only downloaded when visited
const Projects = lazy(() => import('./pages/Projects'));
const Contact  = lazy(() => import('./pages/Contact'));
const Tasks    = lazy(() => import('./pages/Tasks'));
const NotFound = lazy(() => import('./pages/NotFound'));

import './App.css';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) =>
      previous === 'dark' ? 'light' : 'dark'
    );
  };

  return (
    <div className="app">
      <NavBar
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/*
        Suspense is placed at the route level so each lazy route shows the
        fallback independently. NavBar and Footer are never wrapped — they
        are eager components that remain visible during chunk loading.
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;
