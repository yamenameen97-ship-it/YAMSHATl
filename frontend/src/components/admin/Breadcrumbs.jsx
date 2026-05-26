import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [] }) {
  return (
    <div className="breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb-item">
          {item.to ? <Link to={item.to}>{item.label}</Link> : <strong>{item.label}</strong>}
          {index < items.length - 1 ? <span className="breadcrumb-separator">/</span> : null}
        </span>
      ))}
    </div>
  );
}
