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
                const res = await api.post('/auth/register-org', {
                    orgName,
                    document,
                    adminName: name,
                    adminEmail: email,
                    password
                });

                // Backend now returns { access_token, user }
                if (res.data.user) {
                    login(res.data.access_token, res.data.user);
                } else {
                    // Fallback if backend not updated
                    login(res.data.access_token, {
                        id: 'ADMIN',
                        email,
                        name: name,
                        role: 'ADMIN',
                        organizationId: 'PENDING'
                    });
                }
                navigate('/dashboard');
            } else {
                const res = await api.post('/auth/login', {
                    email,
                    password,
                    document, // Send document for login
                });

                // Backend now returns { access_token, user }
                if (res.data.user) {
                    login(res.data.access_token, res.data.user);
                } else {
                    // Fallback
                    // We can try to decode token if needed, but for now let's hope backend is updated
                    // Or just put placeholders since we don't have orgId
                    login(res.data.access_token, {
                        id: 'USER',
                        email,
                        name: 'User',
                        role: 'ADMIN',
                        organizationId: 'UNKNOWN'
                    });
                }
                navigate('/dashboard');
            }
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError((err as any).response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                    {isRegistering ? 'Nova Organização' : 'Entrar no Frota2026'}
                </h2>

                {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {isRegistering && (
                        <>
                            <input placeholder="Nome da Empresa" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </>
                    )}

                    <input placeholder="CNPJ / Documento da Empresa" value={document} onChange={e => setDocument(e.target.value)} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />

                    {isRegistering && (
                        <input placeholder="Seu Nome (Admin)" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    )}

                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                    <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" required />

                    <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
                        {isRegistering ? 'Criar e Entrar' : 'Entrar'}
                    </button>
                </form>

                <div className="text-center">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        {isRegistering ? 'Já tem conta? Faça Login' : 'Precisa de conta? Registre sua Empresa'}
                    </button>
                </div>
            </div>
        </div>
    );
}
