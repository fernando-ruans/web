import React from 'react';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
  className?: string;
}

function List<T>({ items, renderItem, className = '' }: ListProps<T>) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, idx) => (
        <div key={idx}>{renderItem(item, idx)}</div>
      ))}
    </div>
  );
}

export default List;
