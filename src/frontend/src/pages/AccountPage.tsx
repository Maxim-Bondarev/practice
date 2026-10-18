import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

import { ALL_APPLICATIONS } from "../App";
import type { Application } from "../types/types";

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    return;
  }

  function count_application(applications: Application[]): number {
    return applications.filter(item => item.status.includes("Мои")).length
  }

  return (
    <div className="account_page">
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        <FaArrowLeftLong size={11.5}/>Вернуться на главную
      </button>
      <div className="user_info">
        <p><span>Имя пользователя: </span>{user.username}</p>
        <p><span>Почта: </span>{user.email}</p>
        <p>
          <span>Имя: </span>{user.firstName} {user.lastName}
        </p>
      </div>
      <div className="application_history">
        <label className="history_label">История заявок: <span>{count_application(ALL_APPLICATIONS)} шт</span></label>
        {ALL_APPLICATIONS.filter((item) => item.status.includes("Мои")).map(
          (item) => (
            <div key={item.id}>
              <h1>{item.title}</h1>
              <span className="status">{item.status}</span>
              <span>{item.date.toLocaleDateString()}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default AccountPage;