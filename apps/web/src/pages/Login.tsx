import { useState, useEffect } from 'react';
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

    // Handle social login redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');

        if (token && userDataStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userDataStr));
                login(token, userData);
                navigate('/dashboard');
            } catch (err) {
                console.error('Failed to parse social login data', err);
                setError('Falha ao processar login social');
            }
        }
    }, [login, navigate]);

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
            <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full blur-3xl filter opacity-20 animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl filter opacity-20 animate-pulse delay-1000" />

            <div className="w-full max-w-md space-y-8 p-8 glass-card relative z-10 border border-border/50 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-8 bg-white p-4 rounded-3xl shadow-xl">
                        <img src="/logo.png" alt="Paraopeba Transportes" className="h-[120px] w-auto object-contain" />
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground">
                        {isRegistering ? 'Nova Organização' : 'Acesso Restrito'}
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest opacity-60">
                        {isRegistering ? 'Preencha os dados da sua empresa' : 'Sistema de Gestão de Frota 2026'}
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
                        className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Processando...' : (isRegistering ? 'Criar Organização' : 'Entrar no Sistema')}
                    </button>
                </form>

                {!isRegistering && (
                    <div className="space-y-4">
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-border/50"></div>
                            <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase tracking-widest">Ou continue com</span>
                            <div className="flex-grow border-t border-border/50"></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const baseUrl = import.meta.env.VITE_API_URL || '/api';
                                window.location.href = `${baseUrl}/auth/google`;
                            }}
                            className="w-full py-3 px-6 bg-white/5 border border-border/50 text-foreground rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                            Entrar com Google
                        </button>
                    </div>
                )}

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
                    padding: 0.85rem 1rem;
                    padding-left: 3rem !important;
                    background: var(--muted);
                    border: 1px solid var(--border);
                    border-radius: 1rem;
                    outline: none;
                    transition: all 0.2s;
                    color: var(--foreground);
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                .auth-input:focus {
                    border-color: var(--primary);
                    background: var(--card);
                }
                .glass-card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 2.5rem;
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
