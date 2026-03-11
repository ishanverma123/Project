import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CreateProperty from './pages/CreateProperty'
import MyProfile from './pages/MyProfile'
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
                <RequireRole allow="traveller">
                  <Home />
                </RequireRole>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireRole allow={['traveller', 'driver']}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="dashboard/new-ride"
              element={
                <RequireRole allow="driver">
                  <CreateProperty />
                </RequireRole>
              }
            />
            <Route
              path="profile"
              element={
                <RequireRole allow={['traveller', 'driver']}>
                  <MyProfile />
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
