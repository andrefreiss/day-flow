import { Route, Routes } from 'react-router';
import { GuestRoute } from './features/auth/guest-route.tsx';
import { ProtectedRoute } from './features/auth/protected-route.tsx';
import { LoginPage } from './pages/login-page.tsx';
import { NotFoundPage } from './pages/not-found-page.tsx';
import { TodayPage } from './pages/today-page.tsx';

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<TodayPage />} />
      </Route>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
