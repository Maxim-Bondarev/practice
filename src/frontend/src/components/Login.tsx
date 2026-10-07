import React from "react";

import { useAuth } from "../contexts/AuthContext";
import { Link, Navigate } from "react-router-dom";

function Login() {
  const { login, authenticated, initialized } = useAuth();

  if (authenticated && initialized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="registration">
      <button onClick={() => login("/")}>Создать</button>
      <p className="link-to-register"> Нет аккаунта? <Link to="/register"/></p>
    </div>
  );
}

export default Login;
