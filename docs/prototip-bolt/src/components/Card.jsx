export default function Card({ children, className = '' }) {
  return <div className={`glass-card p-4 ${className}`}>{children}</div>
}
