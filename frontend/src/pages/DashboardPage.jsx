import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import api from '../api/client';

export default function DashboardPage() {
  const [data, setData] = useState({ total_evaluations: 0, average_automation_score: 0 });
  const navigate = useNavigate();
  useEffect(() => { api.get('/api/dashboard').then((r) => setData(r.data)); }, []);
  return <div><TopNav /><main className="page"><h1>Dashboard</h1><div className="hero">Discover automation opportunities and evaluate business processes.</div>
    <div className="actions"><button onClick={()=>navigate('/evaluate')}>Start Evaluation</button><button onClick={()=>navigate('/use-cases/domain')}>Domain Use Case Discovery</button><button onClick={()=>navigate('/use-cases/company')}>Company Use Case Discovery</button><button onClick={()=>navigate('/my-evaluations')}>My Evaluations</button></div>
    <div className="stats"><div className="card"><h3>Total evaluations</h3><p>{data.total_evaluations}</p></div><div className="card"><h3>Avg automation score</h3><p>{data.average_automation_score}</p></div></div></main></div>;
}
