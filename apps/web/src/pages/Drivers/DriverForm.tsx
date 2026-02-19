import { useState } from 'react';
import { api } from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

export function DriverForm() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);

 // Initial State
 const [formData, setFormData] = useState({
 name: '',
 email: '',
 password: '', // Should be temporary or generated
 licenseNumber: '',
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 await api.post('/drivers', formData);
 navigate('/drivers');
 } catch (error) {
 alert('Error creating driver');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-xl mx-auto">
 <h1 className="text-2xl font-bold mb-6">Register New Driver</h1>
 <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">

 <div>
 <label className="block text-sm font-medium mb-1">Full Name</label>
 <input className="w-full p-2 border rounded" required
 value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">Email</label>
 <input type="email" className="w-full p-2 border rounded" required
 value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">Initial Password</label>
 <input type="password" className="w-full p-2 border rounded" required minLength={6}
 value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
 placeholder="Set a temporary password"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-1">Driver License (CNH)</label>
 <input className="w-full p-2 border rounded" required
 value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
 />
 </div>

 <div className="pt-4 flex justify-end gap-2">
 <button type="button" onClick={() => navigate('/drivers')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
 Cancel
 </button>
 <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
 {loading ? 'Saving...' : 'Save Driver'}
 </button>
 </div>
 </form>
 </div>
 );
}

