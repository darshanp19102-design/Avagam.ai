import { Link, useNavigate } from 'react-router-dom';

export default function TopNav() {
  const navigate = useNavigate();
  return (
    <header className="topnav">
      <div className="logo">Avagama.ai</div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/my-evaluations">My evaluations</Link>
        <Link to="/use-cases/domain">AI use-case discovery</Link>
      </nav>
      <button onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
    </header>
  );
}
