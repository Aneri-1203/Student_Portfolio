/**
 * PageLoader
 * Accessible loading fallback shown while a lazy-loaded route is being
 * downloaded. Matches the portfolio dark/light theme via CSS variables.
 */
function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading page, please wait"
    >
      <div className="page-loader-spinner" aria-hidden="true" />
      <p className="page-loader-text">Loading…</p>
    </div>
  );
}

export default PageLoader;
