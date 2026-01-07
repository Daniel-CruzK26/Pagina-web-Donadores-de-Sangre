import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ClinicsPage } from './pages/ClinicsPage'
import { Login } from './pages/Auth/Login'
import { Signup } from './pages/Auth/Signup'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DonorDashboard } from './pages/DonorDashboard'
import { RequestDashboard } from './pages/RequestDashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <div className="main-content">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/clinicas" element={<ClinicsPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Rutas protegidas */}
            <Route
              path="/donar"
              element={
                <ProtectedRoute>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/solicitar"
              element={
                <ProtectedRoute>
                  <RequestDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
