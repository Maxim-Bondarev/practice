import React from "react";
import { Link, Navigate, Route } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const { register, logout, user, authenticated } = useAuth();

  return (
    <div className="home_page" style={{ padding: "100px" }}>
      {authenticated ? (
        <>
          <Link to="/account">перейти к аккаунту</Link>
          <button
            style={{ width: "100px", height: "50px", backgroundColor: "fffff" }}
            onClick={() => logout("/")}
          >
            выйти из аккаунта <Link to="/register" />
          </button>
        </>
      ) : (
        <button
          style={{ width: "100px", height: "50px", backgroundColor: "fffff" }}
          onClick={() => register("/")}
        >
          перейти к регистрации <Link to="/register" />
        </button>
      )}
    </div>
  );
}

export default HomePage;
