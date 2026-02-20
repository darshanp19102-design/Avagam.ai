import { useState } from 'react';
import TopNav from '../components/TopNav';
import api from '../api/client';

export default function DomainUseCasePage(){
  const [form, setForm] = useState({domain:'', user_role:'', objective:''});
  const [result, setResult] = useState(null);
  return <div><TopNav/><main className='page'><h1>AI use-case discovery - By domain</h1>
  <div className='grid3'><input placeholder='Domain' onChange={e=>setForm({...form,domain:e.target.value})}/><input placeholder='User role' onChange={e=>setForm({...form,user_role:e.target.value})}/><input placeholder='Objective' onChange={e=>setForm({...form,objective:e.target.value})}/></div>
  <button onClick={async()=>setResult((await api.post('/api/use-cases/domain', form)).data)}>Discover</button>
  <pre className='pre'>{JSON.stringify(result?.agent_response || {}, null, 2)}</pre></main></div>
}
