import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MapPage } from './pages/MapPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminPinsPage } from './pages/admin/AdminPinsPage'
import { AdminBuildingsPage } from './pages/admin/AdminBuildingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="pins" replace />} />
          <Route path="pins" element={<AdminPinsPage />} />
          <Route path="buildings" element={<AdminBuildingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
