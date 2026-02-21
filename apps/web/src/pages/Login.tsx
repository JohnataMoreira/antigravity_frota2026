import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Building, User, UserCheck } from 'lucide-react';

export function Login() {
    const [isRegistering, setIsRegistering] = useState(false);

    // Auth Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Registration Fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [orgName, setOrgName] = useState('');
    const [document, setDocument] = useState(''); // Keep for DB but can be labeled "CNPJ"

    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isRegistering && password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);

        try {
            if (isRegistering) {
                const res = await api.post('/auth/register-org', {
                    firstName,
                    lastName,
                    orgName,
                    document: document || undefined,
                    email,
                    password
                });

                login(res.data.access_token, res.data.user);
                navigate('/dashboard');
            } else {
                const res = await api.post('/auth/login', {
                    email,
                    password,
                });

                login(res.data.access_token, res.data.user);
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error('Auth Error:', err.response?.data);
            setError(err.response?.data?.message || 'Falha na autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl filter opacity-30 animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-accent/20 rounded-full blur-3xl filter opacity-30 animate-pulse delay-1000" />

            <div className="w-full max-w-md space-y-8 p-8 glass-card relative z-10 border border-border/50 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-8 bg-white/90 p-4 rounded-3xl shadow-inner">
                        <img src="/logo.png" alt="Paraopeba Transportes" className="h-[120px] w-auto object-contain drop-shadow-xl" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight gradient-text">
                        {isRegistering ? 'Nova Organização' : 'Entrar no Sistema'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isRegistering ? 'Preencha os dados da sua empresa' : 'Seja bem-vindo de volta'}
                    </p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {isRegistering ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Nome</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            placeholder="Nome"
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="auth-input pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Sobrenome</label>
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            placeholder="Sobrenome"
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="auth-input pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Empresa</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        placeholder="Nome da Empresa"
                                        value={orgName}
                                        onChange={e => setOrgName(e.target.value)}
                                        className="auth-input pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">CNPJ (Opcional)</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        placeholder="00.000.000/0000-00"
                                        value={document}
                                        onChange={e => setDocument(e.target.value)}
                                        className="auth-input pl-10"
                                    />
                                </div>
                            </div>
                        </>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="auth-input pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="auth-input pl-10"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    {isRegistering && (
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium ml-1">Confirmar Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="auth-input pl-10"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/25 disabled:opacity-50 disabled:scale-100 disabled:bg-gray-400"
                    >
                        {loading ? 'Processando...' : (isRegistering ? 'Criar Organização' : 'Entrar')}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <button
                        disabled={loading}
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                        className="text-sm font-medium text-primary hover:underline transition-all"
                    >
                        {isRegistering ? 'Já possui uma conta? Faça Login' : 'Não tem conta? Registre sua Empresa'}
                    </button>
                </div>
            </div>

            <style>{`
                .auth-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    padding-left: 3rem !important; /* Force padding for icons */
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    outline: none;
                    transition: all 0.2s;
                    color: var(--foreground);
                }
                .auth-input:focus {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
                }
                .glass-card {
                    background: rgba(var(--background-rgb), 0.7);
                    backdrop-filter: blur(20px);
                    border-radius: 2rem;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
