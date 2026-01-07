import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    navigate('/') // Navegar primero
    
    const { error } = await signOut()
    if (error) {
      toast.error('Error al cerrar sesión')
    } else {
      toast.success('Sesión cerrada')
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-logo">
          <Heart fill="currentColor" />
          <span>Donadores</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-nav">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/clinicas" className="nav-link">Clínicas</Link>
          
          {user ? (
            <>
              <Link to="/donar" className="nav-link">Quiero Donar</Link>
              <Link to="/solicitar" className="nav-link">Necesito Donadores</Link>
              <div className="nav-user-menu">
                <button
                  className="nav-link user-button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    font: 'inherit'
                  }}
                >
                  <User size={18} />
                  <span>{profile?.full_name || 'Usuario'}</span>
                </button>
                <div className="user-dropdown">
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: '#666'
                    }}
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
              <Link
                to="/signup"
                className="nav-link nav-button-register"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <>
          <div
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
          ></div>
          <div className="mobile-menu">
            <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
              Inicio
            </Link>
            <Link to="/clinicas" className="mobile-nav-link" onClick={closeMobileMenu}>
              Clínicas
            </Link>

            {user ? (
              <>
                <Link to="/donar" className="mobile-nav-link" onClick={closeMobileMenu}>
                  Quiero Donar
                </Link>
                <Link to="/solicitar" className="mobile-nav-link" onClick={closeMobileMenu}>
                  Necesito Donadores
                </Link>
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #e0e0e0',
                  marginTop: '0.5rem'
                }}>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    {profile?.full_name || user.email}
                  </p>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.75rem',
                      background: '#f5f5f5',
                      border: 'none',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: '#666'
                    }}
                  >
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/signup"
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: '600',
                    margin: '0.5rem 1rem'
                  }}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  )
}

export default Navbar
