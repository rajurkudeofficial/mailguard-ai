
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Threats } from './pages/Threats';
import { Inbox } from './pages/Inbox';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/threats" element={<Threats />} />
          <Route path="/trusted" element={<div className="p-8 text-center text-slate-400">Trusted Senders View (Coming Soon)</div>} />
          <Route path="/settings" element={<div className="p-8 text-center text-slate-400">Settings View (Coming Soon)</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
