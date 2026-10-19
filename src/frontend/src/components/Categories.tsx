import type { CategoriesProps, ApplicationCategory } from "../types/types";

const categories: {
  key: ApplicationCategory;
  name: string;
}[] = [
  { key: "Все", name: "Все" },
  { key: "Новые", name: "Новые" },
  { key: "В обработке", name: "В обработке" },
  { key: "Завершенные", name: "Завершенные" },
  { key: "Отклоненные", name: "Отклоненные" },
  { key: "Мои", name: "Мои" },
];

function Categories({ onCategoryChange }: CategoriesProps) {
  return (
    <div className="categories">
      {categories.map((category) => (
        <div
          key={category.key}
          onClick={() => onCategoryChange(category.key)}
        >
          {category.name}
        </div>
      ))}
    </div>
  );
}

export default Categories;
