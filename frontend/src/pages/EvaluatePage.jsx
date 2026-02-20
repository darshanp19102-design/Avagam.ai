import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import api from '../api/client';

export default function EvaluatePage() {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ process_name:'', description:'', volume:'', frequency:'', exception_rate:10, complexity:5, risk_tolerance:'Medium', compliance_sensitivity:'Medium', decision_points:'', sop_metadata:null});

  const submit = async () => {
    setLoading(true);
    const res = await api.post('/api/evaluations', form);
    navigate(`/results/${res.data.id}`);
  };

  if (loading) return <div><TopNav/><div className="loader">Evaluating your process...</div></div>;

  return <div><TopNav/><main className="page"><h1>Evaluate a process</h1>
    <input placeholder='Process name' onChange={e=>setForm({...form,process_name:e.target.value})}/>
    <textarea placeholder='Process description' onChange={e=>setForm({...form,description:e.target.value})}/>
    <div className="grid3">
      <input placeholder='Process volume' onChange={e=>setForm({...form,volume:e.target.value})}/>
      <input placeholder='Frequency' onChange={e=>setForm({...form,frequency:e.target.value})}/>
      <input type='number' placeholder='Exception rate %' onChange={e=>setForm({...form,exception_rate:Number(e.target.value)})}/>
      <input type='number' placeholder='Complexity' onChange={e=>setForm({...form,complexity:Number(e.target.value)})}/>
      <input placeholder='Risk tolerance' onChange={e=>setForm({...form,risk_tolerance:e.target.value})}/>
      <input placeholder='Compliance sensitivity' onChange={e=>setForm({...form,compliance_sensitivity:e.target.value})}/>
    </div>
    <textarea placeholder='Decision points' onChange={e=>setForm({...form,decision_points:e.target.value})}/>
    <button onClick={()=>setShowConfirm(true)}>Submit details</button>
    {showConfirm && <div className='modal'><div className='modal-card'><h3>Confirm Submission</h3><p>Are you sure you want to submit this evaluation?</p><button onClick={()=>setShowConfirm(false)}>Cancel</button><button onClick={submit}>Confirm</button></div></div>}
  </main></div>;
}
