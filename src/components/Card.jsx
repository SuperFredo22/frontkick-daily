export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-card shadow-card p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
