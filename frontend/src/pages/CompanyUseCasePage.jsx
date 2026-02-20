import { useState } from 'react';
import TopNav from '../components/TopNav';
import api from '../api/client';

export default function CompanyUseCasePage(){
  const [company_name, setCompanyName] = useState('');
  const [result, setResult] = useState(null);
  return <div><TopNav/><main className='page'><h1>AI use-case discovery - By company</h1>
  <input placeholder='Company name' onChange={e=>setCompanyName(e.target.value)}/><button onClick={async()=>setResult((await api.post('/api/use-cases/company', {company_name})).data)}>Discover</button>
  <pre className='pre'>{JSON.stringify(result?.agent_response || {}, null, 2)}</pre></main></div>
}
