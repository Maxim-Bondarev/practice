import React from "react";
import { Link, Navigate, Route } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const { register, logout, user, authenticated } = useAuth();

  return (
    <div className="home_page">
      
    </div>
  );
}

export default HomePage;
