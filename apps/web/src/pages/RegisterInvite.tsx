import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { applyThemeColor } from '../lib/utils';
import { Mail, Lock, User, Loader2, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

                // Apply organization branding immediately on validation
                if (res.data?.organization?.primaryColor) {
                    applyThemeColor(res.data.organization.primaryColor);
                }
            } catch (err: any) {
                const message = err.response?.data?.message || 'Convite inválido ou expirado.';
                setError(message);
                toast.error(message, { id: 'invite-error' });
                applyThemeColor(null);
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
            toast.error('As senhas não coincidem');
            return;
        }

        setSubmitting(true);
        const loadingToast = toast.loading('Criando sua conta...');
        
        try {
            const res = await api.post('/auth/register-invite', {
                token,
                name,
                password
            });

            toast.success('Cadastro concluído com sucesso!', { id: loadingToast });
            
            // Short delay to let the toast be seen
            setTimeout(() => {
                login(res.data.access_token, res.data.user);
                navigate('/dashboard');
            }, 800);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Falha ao concluir cadastro';
            setError(message);
            toast.error(message, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse font-medium">Validando seu convite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full glass-card p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl ring-8 ring-red-50/50">
                        <AlertCircle className="text-red-500" size={48} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-gray-900">Oops!</h1>
                        <p className="text-muted-foreground font-medium leading-relaxed">{error}</p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Voltar para o Login
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 -left-12 w-96 h-96 bg-primary/20 rounded-full blur-[100px] filter opacity-30 animate-pulse" />
            <div className="absolute bottom-0 -right-12 w-96 h-96 bg-accent/20 rounded-full blur-[100px] filter opacity-30 animate-pulse delay-700" />
            
            <div className="w-full max-w-md space-y-8 p-10 glass-card relative z-10 border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-6 scale-up-animation">
                        {inviteData?.organization?.logoUrl ? (
                            <div className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-primary/10 border border-gray-100">
                                <img
                                    src={inviteData.organization.logoUrl}
                                    alt={inviteData.organization.name}
                                    className="h-20 w-auto object-contain"
                                />
                            </div>
                        ) : (
                            <div className="bg-primary text-primary-foreground p-6 rounded-[2rem] shadow-2xl shadow-primary/20 ring-8 ring-primary/5">
                                <ShieldCheck size={48} />
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black tracking-tight gradient-text">
                            Bem-vindo!
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            Complete seu cadastro para começar
                        </p>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 backdrop-blur-sm">
                        <p className="text-sm font-bold text-primary flex items-center justify-center gap-2.5">
                            <CheckCircle2 size={18} className="text-primary" />
                            Convite para: <span className="font-black underline decoration-primary/30 underline-offset-4">{inviteData?.organization?.name}</span>
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="email"
                                value={inviteData?.email}
                                disabled
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-400 cursor-not-allowed shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                placeholder="Seu nome"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="auth-input pl-12"
                                required
                                autoComplete="name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Sua Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="auth-input pl-12 text-lg tracking-widest"
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Confirmar Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={`auth-input pl-12 text-lg tracking-widest ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-[10px] font-bold text-red-500 ml-2 animate-bounce">As senhas não coincidem</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-5 bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground rounded-2xl font-black text-lg shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <span>Concluir Meu Cadastro</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                .auth-input {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    background: rgba(0, 0, 0, 0.03);
                    border: 1.5px solid rgba(0, 0, 0, 0.05);
                    border-radius: 1.5rem;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-weight: 600;
                }
                .auth-input:focus {
                    background: white;
                    border-color: hsl(var(--primary));
                    box-shadow: 0 0 0 5px hsla(var(--primary) / 0.1);
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(24px);
                    border-radius: 3rem;
                }
                .gradient-text {
                    background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                @keyframes scale-up {
                    from { transform: scale(0.8) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                .scale-up-animation {
                    animation: scale-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
}

export default RegisterInvite;
