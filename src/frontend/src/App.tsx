import { Navigate, replace, Route, Routes } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import Register from './components/Register'
import Login from './components/Login'
import AccountPage from './pages/AccountPage'

function App() {
  

  return (
    <>
      <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>  
        <Route path='/account' element={<AccountPage/>}/>
      </Routes>      
    </>
  )
}

export default App
