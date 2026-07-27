function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-box">
      <p>Couldn't reach GitHub: {message}</p>
      <button className="retry-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export default ErrorMessage;