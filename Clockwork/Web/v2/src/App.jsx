import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { setAuthRequiredHandler, clearAuthRequiredHandler } from './api/clockwork.js'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import RequestList from './pages/RequestList.jsx'
import RequestDetail from './pages/RequestDetail.jsx'
import Operations from './pages/Operations.jsx'

// Authentication is reactive, not gated: pages render immediately and call the API normally.
// Only when the backend replies 403 with a `requires` array (i.e. auth is configured —
// NullAuthenticator never returns 403) does the request layer invoke the handler registered here,
// redirecting to /login. So when no key is configured, the login page is never shown.
export default function App() {
  const navigate = useNavigate()

  useEffect(() => {
    setAuthRequiredHandler(() => {
      // HashRouter: the current route lives in window.location.hash as "#/path".
      const from = window.location.hash.replace(/^#/, '') || '/'
      navigate('/login', { replace: true, state: { from: { pathname: from } } })
    })
    return () => clearAuthRequiredHandler()
  }, [navigate])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Overview />} />
      <Route path="/requests" element={<RequestList />} />
      <Route path="/requests/:id" element={<RequestDetail />} />
      <Route path="/operations" element={<Operations />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
