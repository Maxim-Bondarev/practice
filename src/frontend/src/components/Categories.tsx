import type { ApplicationCategory, CategoriesProps } from "../types/types";

const CATEGORY_NAMES: Record<ApplicationCategory, string> = {
  Актуальные: "Актуальные",
  Открыта: "Открытые",
  "В обработке": "В обработке",
  Закрыта: "Закрытые",
  Мои: "Мои",
  Все: "Все",
};

const categories = Object.keys(CATEGORY_NAMES) as ApplicationCategory[];

function Categories({ current, onCategoryChange }: CategoriesProps) {
  return (
    <div className="categories">
      {categories.map((key) => (
        <div
          key={key}
          className={current === key ? "active" : undefined}
          onClick={() => onCategoryChange(key)}
        >
          {CATEGORY_NAMES[key]}
        </div>
      ))}
    </div>
  );
}

export default Categories;
