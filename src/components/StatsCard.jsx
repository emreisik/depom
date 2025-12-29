const StatsCard = ({ title, value, icon, className = '' }) => {
  return (
    <div className={`stats-card ${className}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <p className="stats-value">{value}</p>
      </div>
    </div>
  )
}

export default StatsCard


