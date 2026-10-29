import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type {
  Application,
  ApplicationCategory,
  ApplicationSort,
  Project,
} from "../types/types";
import { PROJECTS } from "../domain/statuses";
import Categories from "../components/Categories";
import ApplicationCard from "../components/ApplicationCard";
import { IoClose } from "react-icons/io5";

const SORT_LABELS: Record<ApplicationSort, string> = {
  newest: "Сначала новые",
  oldest: "Сначала старые",
  activity: "По последнему сообщению",
};

const SORTS = Object.keys(SORT_LABELS) as ApplicationSort[];

interface Props {
  items: Application[];
  category: ApplicationCategory;
  project: Project | "";
  sort: ApplicationSort;
  searchValue: string;
  onCategoryChange: (c: ApplicationCategory) => void;
  onProjectChange: (project: Project | "") => void;
  onSortChange: (sort: ApplicationSort) => void;
  onSetSearchValue: (value: string) => void;
}

function HomePage({
  items,
  category,
  project,
  sort,
  searchValue,
  onCategoryChange,
  onProjectChange,
  onSortChange,
  onSetSearchValue,
}: Props) {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home_page">
      <h1>Заявки</h1>
      <p>Здесь вы можете найти и отследить обращения</p>
      <div className="search_block">
        <input
          value={searchValue}
          onChange={(event) => onSetSearchValue(event.target.value)}
          type="text"
          placeholder="Поиск по названию, автору или номеру"
        />
        <IoClose
          style={{
            position: "absolute",
            top: "14px",
            right: "20px",
            cursor: "pointer",
          }}
          size={20}
          onClick={() => onSetSearchValue("")}
        />
      </div>

      <div className="filters">
        <Categories current={category} onCategoryChange={onCategoryChange} />
        <div className="filter_selects">
          <select
            className="filter_select"
            aria-label="Проект"
            value={project}
            onChange={(e) => onProjectChange(e.target.value as Project | "")}
          >
            <option value="">Все проекты</option>
            {PROJECTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            className="filter_select"
            aria-label="Сортировка"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ApplicationSort)}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="applications-list">
        {items.map((item) => (
          <ApplicationCard key={item.id} item={item} />
        ))}
      </div>

      {authenticated ? (
        <button onClick={() => navigate("/create-application")}>
          + Создать заявку
        </button>
      ) : (
        <button onClick={() => login("/create-application")}>
          + Создать заявку
        </button>
      )}
    </div>
  );
}

export default HomePage;