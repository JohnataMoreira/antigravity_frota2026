import { useState } from 'react';
import { api } from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

export function VehicleForm() {
 const navigate = useNavigate();
 const [loading, setLoading] = useState(false);
 // State form
 const [formData, setFormData] = useState({
 plate: '',
 model: '',
 brand: '',
 type: 'CAR',
 currentKm: 0,
 year: new Date().getFullYear(),
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 await api.post('/vehicles', {
 ...formData,
 currentKm: Number(formData.currentKm),
 year: Number(formData.year)
 });
 navigate('/vehicles');
 } catch (error) {
 alert('Error creating vehicle');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto">
 <h1 className="text-2xl font-bold mb-6">Register New Vehicle</h1>
 <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-1">Plate</label>
 <input className="w-full p-2 border rounded" required
 value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Brand</label>
 <input className="w-full p-2 border rounded" required
 value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-1">Model</label>
 <input className="w-full p-2 border rounded" required
 value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Year</label>
 <input type="number" className="w-full p-2 border rounded" required
 value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium mb-1">Type</label>
 <select className="w-full p-2 border rounded"
 value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
 >
 <option value="CAR">Car</option>
 <option value="TRUCK">Truck</option>
 <option value="MOTORCYCLE">Motorcycle</option>
 <option value="MACHINE">Machine</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1">Current KM</label>
 <input type="number" className="w-full p-2 border rounded" required min="0"
 value={formData.currentKm} onChange={e => setFormData({ ...formData, currentKm: Number(e.target.value) })}
 />
 </div>
 </div>

 <div className="pt-4 flex justify-end gap-2">
 <button type="button" onClick={() => navigate('/vehicles')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
 Cancel
 </button>
 <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
 {loading ? 'Saving...' : 'Save Vehicle'}
 </button>
 </div>
 </form>
 </div>
 );
}

