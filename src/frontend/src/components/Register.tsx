import React from "react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

function Register() {
  const { register, authenticated, initialized } = useAuth();

  if (initialized && authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="registration">
      <button onClick={() => register("/")}>Создать</button>
      <p className="link-to-login">
        Есть акканут? <Link to="/login" />
      </p>
    </div>
  );
}

export default Register;
