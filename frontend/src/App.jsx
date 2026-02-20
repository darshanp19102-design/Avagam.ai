import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EvaluatePage from './pages/EvaluatePage';
import ResultsPage from './pages/ResultsPage';
import MyEvaluationsPage from './pages/MyEvaluationsPage';
import DomainUseCasePage from './pages/DomainUseCasePage';
import CompanyUseCasePage from './pages/CompanyUseCasePage';

const Protected = ({ children }) => (localStorage.getItem('token') ? children : <Navigate to="/login" />);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/evaluate" element={<Protected><EvaluatePage /></Protected>} />
      <Route path="/results/:id" element={<Protected><ResultsPage /></Protected>} />
      <Route path="/my-evaluations" element={<Protected><MyEvaluationsPage /></Protected>} />
      <Route path="/use-cases/domain" element={<Protected><DomainUseCasePage /></Protected>} />
      <Route path="/use-cases/company" element={<Protected><CompanyUseCasePage /></Protected>} />
    </Routes>
  );
}
