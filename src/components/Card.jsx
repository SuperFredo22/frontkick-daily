export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-card shadow-card p-4 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', ...(props.style || {}) }}
      {...props}
    >
      {children}
    </div>
  );
}
