import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '../lib/auth.js'

// Mirrors the prototype's login guard: unauthenticated visitors are bounced to /login,
// preserving the route they tried to reach so we can return there after sign-in.
export default function RequireAuth({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
