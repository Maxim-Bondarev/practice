import { Navigate, replace, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import { useState } from "react";
import type { Application } from "./types/types";
import CreateApplicationPage from "./pages/CreateApplicationPage";
import Moderation from "./pages/Moderation";

export const ALL_APPLICATIONS: Application[] = [
  {
    id: "#1024",
    title: "Не приходит код",
    date: new Date("2026-05-12"),
    project: "1X",
    status: "На модерации",
  },
  {
    id: "#1021",
    title: "Ошибка оплаты",
    date: new Date("2026-05-10"),
    project: "Music",
    status: "В обработке",
  },
  {
    id: "#1018",
    title: "Смена email",
    date: new Date("2026-05-08"),
    project: "Delivery",
    status: "Мои",
  },
];

function App() {
  const [currentItems, setCurrentItems] =
    useState<Application[]>(ALL_APPLICATIONS);
  const [currentCategories, setCurrentCategories] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");

  const chooseCategories = (category: string) => {
    setCurrentCategories(category);

    if (category === "Все") {
      setCurrentItems(ALL_APPLICATIONS);
      return;
    }

    setCurrentItems(
      ALL_APPLICATIONS.filter((item) => item.status === category),
    );
  };

  return (
    <>
      <Header/>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              items={currentItems}
              searchValue={searchValue}
              onCategoryChange={chooseCategories}
              onSetSearchValue={setSearchValue}
            />
          }
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/create-application" element={<CreateApplicationPage />} />
        <Route path="/moderation" element={<Moderation />} />
      </Routes>
    </>
  );
}

export default App;
