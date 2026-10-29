import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

import { useApplications } from "../storage/hooks";
import ApplicationCard from "../components/ApplicationCard";

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const applications = useApplications();

  if (!user) {
    return;
  }

  const myApplications = applications
    .filter((item) => item.authorId === user.id)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

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
          <ApplicationCard key={item.id} item={item} />
        ))}
      </div>
      <div className="logout">
        <button onClick={()=>logout()}>Выйти из аккаунта</button>
      </div>
    </div>
  );
}

export default AccountPage;