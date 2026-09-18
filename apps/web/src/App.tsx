import { Route, Routes } from 'react-router';
import { LoginPage } from './pages/login-page.tsx';
import { NotFoundPage } from './pages/not-found-page.tsx';
import { TodayPage } from './pages/today-page.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
