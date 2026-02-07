import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [name, setName] = useState('');
    const [currentOrgId, setCurrentOrgId] = useState(''); // For login
    // Note: Backend login requires organizationId. 
    // We need to implement lookup or ask user for Org ID.
    // Actually, backend login expects { email, password, organizationId }.
    // This is tricky for UX. Usually email is unique globally or we lookup by email.
    // Our schema has @@unique([organizationId, email]). So email is NOT unique globally.
    // We MUST ask for Organization ID or a unique Organization Slug/Document.
    // Let's add 'Organization Document' field for login.
    const [document, setDocument] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegistering) {
                const res = await api.post('/auth/register', {
                    organization: {
                        name: orgName,
                        document: document // CNPJ
                    },
                    user: {
                        name,
                        email,
                        password
                    }
                });
                // Auto login? or ask to login
                alert('Registered successfully! Please login.');
                setIsRegistering(false);
            } else {
                // Need to find Org ID first? Or change backend to accept document?
                // Backend login requires organizationId.
                // We implemented /auth/login with dto: { email, password, organizationId }
                // We lack an endpoint to find Organization by Document publicly. 
                // This is a flaw in our Plan.
                // Quick fix: Add public endpoint to lookup Org by Document, OR Assume user knows Org ID (bad).
                // Better: Change login to accept { email, password, organizationDocument }.

                // Let's try to pass organizationDocument if backend supports it? Backend does NOT.
                // I will assume for MVP testing we paste the UUID. 
                // Or I implement a lookup endpoint quickly in backend?
                // Let's implement lookup endpoint in backend or change register to return OrgID clearly.

                const res = await api.post('/auth/login', {
                    email,
                    password,
                    organizationId: currentOrgId
                });

                login(res.data.access_token, {
                    id: 'TODO', // Backend should return user info
                    email,
                    name: 'User',
                    role: 'ADMIN'
                });
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                    {isRegistering ? 'Create Account' : 'Sign in to Frota2026'}
                </h2>

                {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isRegistering && (
                        <>
                            <input placeholder="Organization Name" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full p-2 border rounded" required />
                            <input placeholder="CNPJ / Document" value={document} onChange={e => setDocument(e.target.value)} className="w-full p-2 border rounded" required />
                            <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
                        </>
                    )}

                    {!isRegistering && (
                        <input placeholder="Organization ID (UUID)" value={currentOrgId} onChange={e => setCurrentOrgId(e.target.value)} className="w-full p-2 border rounded" required />
                    )}

                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />

                    <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
                        {isRegistering ? 'Register' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-600 hover:underline">
                        {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
                    </button>
                </div>
            </div>
        </div>
    );
}
