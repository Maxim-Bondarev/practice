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
import { useMemo, useState } from "react";
import CreateApplicationPage from "./pages/CreateApplicationPage";
import ApplicationPage from "./pages/ApplicationPage";
import { useApplications } from "./storage/hooks";
import { useAuth } from "./contexts/AuthContext";
import { isClosed } from "./domain/statuses";

function App() {
  const { user } = useAuth();
  const applications = useApplications();

  const [currentCategory, setCurrentCategory] =
    useState<ApplicationCategory>("Актуальные");
  const [project, setProject] = useState<Project | "">("");
  const [sort, setSort] = useState<ApplicationSort>("newest");
  const [searchValue, setSearchValue] = useState("");

  const currentItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    const filtered = applications.filter((item) => {
      if (project && item.project !== project) return false;

      if (
        query &&
        !item.title.toLowerCase().includes(query) &&
        !item.authorName.toLowerCase().includes(query) &&
        !item.id.includes(query)
      ) {
        return false;
      }

      switch (currentCategory) {
        case "Все":
          return true;
        case "Актуальные":
          return !isClosed(item.status);
        case "Мои":
          return !!user && item.authorId === user.id;
        default:
          return item.status === currentCategory;
      }
    });

    const time = (iso: string) => Date.parse(iso);
    const activity = (a: (typeof filtered)[number]) =>
      time(a.lastMessageAt ?? a.date);

    return filtered.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return time(a.date) - time(b.date);
        case "activity":
          return activity(b) - activity(a);
        case "newest":
          return time(b.date) - time(a.date);
      }
    });
  }, [applications, currentCategory, project, sort, searchValue, user]);

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
