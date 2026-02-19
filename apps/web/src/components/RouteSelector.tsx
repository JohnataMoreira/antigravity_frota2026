import { useState, useEffect } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { api } from '../lib/axios';

interface RouteSelectorProps {
 onRouteSelected: (route: [number, number][], destination: string) => void;
}

export function RouteSelector({ onRouteSelected }: RouteSelectorProps) {
 const [destination, setDestination] = useState('');
 const [suggestions, setSuggestions] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(false);

 const searchAddress = async (query: string) => {
 if (query.length < 3) return;
 setIsLoading(true);
 try {
 const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br`);
 const data = await res.json();
 setSuggestions(data);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoading(false);
 }
 };

 const handleSelect = async (place: any) => {
 setDestination(place.display_name);
 setSuggestions([]);

 // Get Current Location (simplified for MVP)
 navigator.geolocation.getCurrentPosition(async (pos) => {
 const start = [pos.coords.latitude, pos.coords.longitude];
 const end = [parseFloat(place.lat), parseFloat(place.lon)];

 // Get Route from OSRM
 try {
 const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
 const data = await res.json();

 if (data.routes && data.routes[0]) {
 const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]); // OSMR returns [lng, lat]
 onRouteSelected(coords, place.display_name);
 }
 } catch (e) {
 console.error('OSRM fail', e);
 }
 });
 };

 return (
 <div className="space-y-4">
 <div className="relative">
 <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-blue-100 focus-within:border-blue-500 transition-all">
 <MapPin className="text-blue-500" size={20} />
 <input
 type="text"
 placeholder="Para onde vamos?"
 className="bg-transparent outline-none flex-1 text-sm font-bold"
 value={destination}
 onChange={(e) => {
 setDestination(e.target.value);
 searchAddress(e.target.value);
 }}
 />
 {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
 </div>

 {suggestions.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 max-h-60 overflow-y-auto">
 {suggestions.map((s, i) => (
 <button
 key={i}
 onClick={() => handleSelect(s)}
 className="w-full text-left p-3 hover:bg-blue-50 text-xs font-medium border-b last:border-0"
 >
 {s.display_name}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

