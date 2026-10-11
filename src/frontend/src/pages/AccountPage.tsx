import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function AccountPage() {
  const { user } = useAuth();
  if (!user) {
    return;
  }
  
  return (
    <div className="home_page" style={{padding: '100px'}}>
      <h1 className="account_head">Ваш аккаунт</h1>
      <ul style={{listStyleType: 'none'}}>
        <li>Имя пользователя: {user.username}</li>
        <li>Имя: {user.firstName}</li>
        <li>Фамилия: {user.lastName}</li>
        <li>Почта: {user.email}</li>
        <li>Роль:{user.role}</li>
        <Link to='/'>Вернуть на главную</Link>
      </ul>
    </div>
  );
}

export default AccountPage;
