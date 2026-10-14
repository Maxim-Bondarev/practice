import React from "react";
import { MdOutlineFeedback } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function Header() {
  const { user } = useAuth();
  return (
    <div className="header">
        <p className="logo"><Link to='/'>Feedback <MdOutlineFeedback size={23}/></Link></p>
      <ul>
        <li>
          <IoNotificationsOutline size={23}/>
        </li>
        <li>
          <Link to='/account'><FaRegUser size={23}/> {user?.username}</Link>
        </li>
      </ul>
    </div>
  );
}

export default Header;
