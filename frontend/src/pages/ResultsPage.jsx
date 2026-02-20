import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import api from '../api/client';

const fields = ['automation_feasibility_score','business_benefit_score','fitment','llm_recommendation','reasoning','process_characteristics','risk_profile','roi_estimate','implementation_complexity'];

export default function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/api/evaluations/${id}`).then((r) => setData(r.data)); }, [id]);
  const content = data?.parsed_content || {};
  return <div><TopNav/><main className='page'><h1>Evaluation results: {data?.process_name}</h1>
    <div className='stats'>{fields.map((f)=><div className='card' key={f}><h3>{f}</h3><p>{typeof content[f] === 'object' ? JSON.stringify(content[f]) : String(content[f] ?? 'N/A')}</p></div>)}</div>
    <h2>Detailed recommendations</h2>
    <pre className='pre'>{JSON.stringify(content?.detailed_recommendations || data?.agent_response, null, 2)}</pre>
  </main></div>;
}
