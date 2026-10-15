import { Navigate, replace, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import Register from "./components/Register";
import Login from "./components/Login";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import { useState } from "react";
import type { Application } from "./types/types";
import CreateApplicationPage from "./pages/CreateApplicationPage";

const ALL_APPLICATIONS: Application[] = [
  {
    id: "#1024",
    title: "Не приходит код",
    descriptions: "...",
    date: new Date("2026-05-12"),
    status: "Новые",
  },
  {
    id: "#1021",
    title: "Ошибка оплаты",
    descriptions: "...",
    date: new Date("2026-05-10"),
    status: "В обработке",
  },
  {
    id: "#1018",
    title: "Смена email",
    descriptions: "...",
    date: new Date("2026-05-08"),
    status: "Завершенные",
  },
];

function App() {
  const [currentItems, setCurrentItems] =
    useState<Application[]>(ALL_APPLICATIONS);
  const [currentCategories, setCurrentCategories] = useState<string>("all");
  const [searchValue, setSearchValue] = useState('');

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
      <Header />
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
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/create-application" element={<CreateApplicationPage/>} />
      </Routes>
    </>
  );
}

export default App;
