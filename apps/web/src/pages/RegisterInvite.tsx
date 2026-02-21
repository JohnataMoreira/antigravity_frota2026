import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function RegisterInvite() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { login } = useAuth();

    const [inviteData, setInviteData] = useState<any>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Link de convite inválido ou ausente.');
            setLoading(false);
            return;
        }

        const validate = async () => {
            try {
                const res = await api.get(`/invites/validate/${token}`);
                setInviteData(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Convite inválido ou expirado.');
            } finally {
                setLoading(false);
            }
        };

        validate();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/auth/register-invite', {
                token,
                name,
                password
            });

            login(res.data.access_token, res.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao concluir cadastro');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full glass-card p-10 text-center space-y-6">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                        <User className="text-red-500" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Ops!</h1>
                    <p className="text-muted-foreground font-medium">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                    >
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl filter opacity-30 animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-accent/20 rounded-full blur-3xl filter opacity-30 animate-pulse delay-1000" />

            <div className="w-full max-w-md space-y-8 p-10 glass-card relative z-10 border border-border/50 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6">
                        <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-xl shadow-blue-500/20">
                            <ShieldCheck size={40} />
                        </div>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight gradient-text">
                        Bem-vindo!
                    </h2>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <p className="text-sm font-bold text-blue-700 flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} />
                            Convite para {inviteData?.organization?.name}
                        </p>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        Complete seu cadastro para acessar a plataforma.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="email"
                                value={inviteData?.email}
                                disabled
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-medium text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                placeholder="Seu nome"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="auth-input pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Senha</label>
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

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Confirmar Senha</label>
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

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            'Concluir Meu Cadastro'
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                .auth-input {
                    width: 100%;
                    padding: 0.85rem 1rem;
                    padding-left: 3rem !important;
                    background: rgba(0, 0, 0, 0.02);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    border-radius: 1.25rem;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .auth-input:focus {
                    background: white;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(20px);
                    border-radius: 2.5rem;
                }
                .gradient-text {
                    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
}
