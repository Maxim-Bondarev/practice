import { MdOutlineFeedback } from "react-icons/md";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import NotificationsBell from "./NotificationsBell";

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
        {authenticated && <NotificationsBell />}
        <li>
          {authenticated ? (
            <Link to="/account">
              <FaRegUser size={20} /> {user?.username}
            </Link>
          ) : (
            <Link to="/register" onClick={() => login("/")}>
              <FaRegUser size={20} /> Войти
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Header;