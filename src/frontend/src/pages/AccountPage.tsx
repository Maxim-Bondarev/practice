import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

import { useApplications } from "../storage/hooks";

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const applications = useApplications();

  if (!user) {
    return;
  }

  const myApplications = applications
    .filter((item) => item.authorId === user.id)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

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

        <p>{user.role}</p>

      </div>
      <div className="application_history">
        <label className="history_label">История заявок: <span>{myApplications.length} шт</span></label>
        {myApplications.map((item) => (
          <Link key={item.id} to={`/applications/${item.id}`}>
            <div>
              <h1>{item.title}</h1>
              <span className="status">{item.status}</span>
              <span>{item.date.toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="logout">
        <button onClick={()=>logout()}>Выйти из аккаунта</button>
      </div>
    </div>
  );
}

export default AccountPage;