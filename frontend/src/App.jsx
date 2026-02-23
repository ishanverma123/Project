import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Home from './pages/Home'
import PropertyDetail from './pages/PropertyDetail'
import BookingPayment from './pages/BookingPayment'
import UserDashboard from './pages/UserDashboard'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SignUp />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="home" element={<Home />} />
          <Route path="property/:id" element={<PropertyDetail />} />
          <Route path="booking/:id" element={<BookingPayment />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
