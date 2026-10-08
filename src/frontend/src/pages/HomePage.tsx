import React from 'react'
import { Link, Navigate, Route } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { register, authenticated, initialized } = useAuth();
  
  
  return (
    <div className='home_page'>
      <button style={{width: '70px', height: '30px', backgroundColor:'fffff'}} onClick={()=> register("/")}>
        перейти к регистрации <Link to="/register"/>
      </button>
    </div>
  )
}

export default HomePage