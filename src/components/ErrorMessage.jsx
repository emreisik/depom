const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Tekrar Dene
        </button>
      )}
    </div>
  )
}

export default ErrorMessage


