import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="not-found">
      <p className="section-label">// 404</p>
      <h2>Page not found</h2>
      <p>The route you're looking for doesn't exist.</p>
      <Link to="/" className="back-home">← Back to Home</Link>
    </section>
  );
}

export default NotFound;