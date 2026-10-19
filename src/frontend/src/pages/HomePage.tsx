import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Application, ApplicationCategory } from "../types/types";
import Categories from "../components/Categories";
import { IoClose } from "react-icons/io5";

interface Props {
  items: Application[];
  searchValue: string;
  onCategoryChange: (c: ApplicationCategory) => void;
  onSetSearchValue: (value: string) => void;
}

function HomePage({
  items,
  searchValue,
  onSetSearchValue,
  onCategoryChange,
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
          placeholder="поиск заявки"
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
      <Categories items={items} onCategoryChange={onCategoryChange} />
      <div className="applications-list">
        {items
          .filter(
            (item) =>
              item.title.toLowerCase().includes(searchValue.toLowerCase()) &&
              item.status !== "На модерации",
          )
          .map((item) => (
            <div key={item.id}>
              <h1>{item.title}</h1>
              <span className="status">{item.status}</span>
              <span>{item.date.toLocaleDateString()}</span>
            </div>
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
