import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { api } from './api';
import type { User } from './types';
import Home from './pages/Home';
import ActiveWorkout from './pages/ActiveWorkout';
import History from './pages/History';
import ProgramView from './pages/ProgramView';
import BottomNav from './components/BottomNav';

interface UserContextType {
  user: User | null;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({ user: null, loading: true });
export const useUser = () => useContext(UserContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.users.default()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      <BrowserRouter>
        <div className="min-h-svh bg-zinc-950 text-zinc-100 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workout/:logId" element={<ActiveWorkout />} />
            <Route path="/history" element={<History />} />
            <Route path="/program" element={<ProgramView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </UserContext.Provider>
  );
}
