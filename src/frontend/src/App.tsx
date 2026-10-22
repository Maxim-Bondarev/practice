import type { ApplicationCategory } from "./types/types";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import { useMemo, useState } from "react";
import CreateApplicationPage from "./pages/CreateApplicationPage";
import Moderation from "./pages/Moderation";
import ApplicationPage from "./pages/ApplicationPage";
import { useApplications } from "./storage/hooks";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { user } = useAuth();
  const applications = useApplications();

  const [currentCategory, setCurrentCategory] =
    useState<ApplicationCategory>("Все");
  const [searchValue, setSearchValue] = useState("");

  const currentItems = useMemo(() => {
    const sorted = [...applications].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    if (currentCategory === "Все") return sorted;
    if (currentCategory === "Мои") {
      return user ? sorted.filter((item) => item.authorId === user.id) : [];
    }
    return sorted.filter((item) => item.status === currentCategory);
  }, [applications, currentCategory, user]);

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              items={currentItems}
              category={currentCategory}
              searchValue={searchValue}
              onCategoryChange={setCurrentCategory}
              onSetSearchValue={setSearchValue}
            />
          }
        />
        <Route path="/applications/:id" element={<ApplicationPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/create-application" element={<CreateApplicationPage />} />
        <Route path="/moderation" element={<Moderation />} />
      </Routes>
    </>
  );
}

export default App;