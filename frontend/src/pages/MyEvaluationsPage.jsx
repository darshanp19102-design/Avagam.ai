import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import api from '../api/client';

export default function MyEvaluationsPage() {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();
  useEffect(() => { api.get('/api/evaluations').then((r) => setRows(r.data)); }, []);
  return <div><TopNav /><main className='page'><h1>My Evaluations</h1>
    <table><thead><tr><th>Process</th><th>Date</th><th>Automation score</th><th>Feasibility score</th><th>Fitment</th><th>Status</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.id} onClick={()=>navigate(`/results/${r.id}`)}><td>{r.process_name}</td><td>{new Date(r.created_at).toLocaleString()}</td><td>{String(r.automation_score ?? '-')}</td><td>{String(r.feasibility_score ?? '-')}</td><td>{String(r.fitment ?? '-')}</td><td>{r.status}</td></tr>)}</tbody></table>
  </main></div>;
}
