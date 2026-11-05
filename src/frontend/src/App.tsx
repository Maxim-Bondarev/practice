import type {
  ApplicationCategory,
  ApplicationSort,
  Project,
} from "./types/types";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import { useState } from "react";
import CreateApplicationPage from "./pages/CreateApplicationPage";
import ApplicationPage from "./pages/ApplicationPage";
import { useApplications } from "./api/hooks";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { authenticated } = useAuth();

  const [currentCategory, setCurrentCategory] =
    useState<ApplicationCategory>("Актуальные");
  const [project, setProject] = useState<Project | "">("");
  const [sort, setSort] = useState<ApplicationSort>("newest");
  const [searchValue, setSearchValue] = useState("");

  const {
    items: currentItems,
    error: applicationsError,
  } = useApplications({
    category: currentCategory,
    project,
    sort,
    search: searchValue,
    authenticated,
  });

  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              items={currentItems}
              error={applicationsError}
              category={currentCategory}
              project={project}
              sort={sort}
              searchValue={searchValue}
              onCategoryChange={setCurrentCategory}
              onProjectChange={setProject}
              onSortChange={setSort}
              onSetSearchValue={setSearchValue}
            />
          }
        />
        <Route path="/applications/:id" element={<ApplicationPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/create-application" element={<CreateApplicationPage />} />
      </Routes>
    </>
  );
}

export default App;
