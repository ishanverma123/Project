import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Home from './pages/Home'
import PropertyDetail from './pages/PropertyDetail'
import BookingPayment from './pages/BookingPayment'
import Dashboard from './pages/Dashboard'
import CreateProperty from './pages/CreateProperty'
import RequireRole from './components/RequireRole'
import { AuthProvider } from './lib/authContext'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<SignUp />} />
            <Route path="signin" element={<SignIn />} />
            <Route
              path="home"
              element={
                <RequireRole allow="tenant">
                  <Home />
                </RequireRole>
              }
            />
            <Route
              path="property/:id"
              element={
                <RequireRole allow="tenant">
                  <PropertyDetail />
                </RequireRole>
              }
            />
            <Route
              path="booking/:id"
              element={
                <RequireRole allow="tenant">
                  <BookingPayment />
                </RequireRole>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireRole allow={['tenant', 'landlord']}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="dashboard/new-property"
              element={
                <RequireRole allow="landlord">
                  <CreateProperty />
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
