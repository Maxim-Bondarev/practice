import React, { useState } from "react";
import type { Application } from "../types/types";

interface Props {
  items: Application[];
  onCategoryChange: (c: string) => void;
}

function Categories({ items, onCategoryChange }: Props) {
  const [currentItems, setCurentItems] = useState([]);
  const categories = [
    { key: "Все", name: "Все" },
    { key: "Новые", name: "Новые" },
    { key: "В обработке", name: "В работе" },
    { key: "Завершенные", name: "Завершенные" },
    { key: "Отклоненные", name: "Отклоненные" },
    { key: "Мои", name: "Мои" },
  ];

  return (
    <div className="categories">
      {categories.map((el) => (
        <div key={el.key} onClick={() => onCategoryChange(el.key)}>
          {el.name}
        </div>
      ))}
    </div>
  );
}

export default Categories;
