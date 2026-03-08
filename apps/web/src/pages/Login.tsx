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

    // Handle OAuth redirect params
    useState(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userDataStr = params.get('user');

        if (token && userDataStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userDataStr));
                login(token, userData);
                navigate('/dashboard');
            } catch (err) {
                console.error('Failed to parse OAuth user data', err);
                setError('Falha ao processar login social');
            }
        }
    });

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
                        <img src="/logo.png" alt="Logo Frota2026" className="h-[120px] w-auto object-contain drop-shadow-xl" />
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
                        className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : (isRegistering ? 'Criar Organização' : 'Entrar')}
                    </button>

                    {!isRegistering && (
                        <>
                            <div className="relative flex items-center gap-4 py-2">
                                <div className="h-px w-full bg-border" />
                                <span className="text-xs text-muted-foreground uppercase whitespace-nowrap">Ou entre com</span>
                                <div className="h-px w-full bg-border" />
                            </div>

                            <button
                                type="button"
                                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`}
                                className="w-full py-3 px-6 bg-white dark:bg-zinc-800 text-foreground border border-border rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continuar com Google
                            </button>
                        </>
                    )}
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
