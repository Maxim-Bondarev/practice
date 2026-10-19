import React from "react";
import { MdOutlineFeedback } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function Header() {
  const { authenticated, user, login } = useAuth();
  return (
    <div className="header">
      <p className="logo">
        <Link to="/">
          Feedback <MdOutlineFeedback size={23} />
        </Link>
      </p>
      <ul>
        <li>
          {user && user.roles.includes("admin") ? (
            <Link to="/moderation">Модерация</Link>
          ) : (
            <IoNotificationsOutline size={23} />
          )}
        </li>
        <li>
          {authenticated ? (
            <Link to="/account">
              <FaRegUser size={23} /> {user?.username}
            </Link>
          ) : (
            <Link to="/register" onClick={() => login("/")}>
              <FaRegUser size={23} /> Войти
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Header;
