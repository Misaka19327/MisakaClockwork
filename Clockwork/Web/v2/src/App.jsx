import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import RequestList from './pages/RequestList.jsx'
import RequestDetail from './pages/RequestDetail.jsx'
import Operations from './pages/Operations.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
      <Route path="/requests" element={<RequireAuth><RequestList /></RequireAuth>} />
      <Route path="/requests/:id" element={<RequireAuth><RequestDetail /></RequireAuth>} />
      <Route path="/operations" element={<RequireAuth><Operations /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
