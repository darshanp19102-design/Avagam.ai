import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ company_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { company_name: form.company_name, email: form.email, password: form.password };
      if (tab === 'signup' && form.password !== form.confirm) {
        throw new Error('Passwords do not match');
      }
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  return <div className="auth-wrap">
    <section className="auth-left">
      <h1>Avagama.ai</h1><h2>AI-powered process evaluation for your enterprise</h2>
      <p>Helps enterprises evaluate and prioritize business processes using AI-driven insights.</p>
    </section>
    <section className="auth-card">
      <div className="tabs"><button className={tab==='login'?'active':''} onClick={()=>setTab('login')}>Sign in</button><button className={tab==='signup'?'active':''} onClick={()=>setTab('signup')}>Sign up</button></div>
      <form onSubmit={submit}>
        {tab==='signup' && <input placeholder="Company Name" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} />}
        <input placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        {tab==='signup' && <input type="password" placeholder="Re-enter password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} />}
        {error && <p className="error">{error}</p>}
        <button className="cta">{tab==='login' ? 'Access your workspace' : 'Create your workspace'}</button>
      </form>
    </section>
  </div>;
}
