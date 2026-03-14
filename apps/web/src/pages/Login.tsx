/// <reference types="vite/client" />
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { SEO } from '@/components/SEO';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Mail, Lock, Building, User, UserCheck, Eye, EyeOff } from 'lucide-react';
import { formatCNPJ } from '../lib/utils';

export function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const cnpjRef = useRef<HTMLInputElement>(null);

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
            <SEO 
                title="Login" 
                description="Acesse sua conta Frota2026 para gerenciar sua frota de forma inteligente." 
            />
            {/* Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full blur-3xl filter opacity-30 animate-pulse" />
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-accent/20 rounded-full blur-3xl filter opacity-30 animate-pulse delay-1000" />

            <div className="w-full max-w-md space-y-8 p-8 glass-card relative z-10 border border-border/50 shadow-2xl">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-8 bg-white/90 p-4 rounded-3xl shadow-inner dark:bg-white/10">
                        <img src="/logo.png?v=20260310" alt="Logo" className="h-[120px] w-auto object-contain drop-shadow-xl" />
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight gradient-text">
                        {isRegistering ? t('auth.new_organization') : t('auth.sign_in')}
                    </h2>
                    <p className="text-muted-foreground">
                        {isRegistering ? t('auth.fill_company_data') : t('auth.welcome_back')}
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
                                    <label className="text-sm font-medium ml-1">{t('auth.first_name')}</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            placeholder={t('auth.first_name')}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="auth-input pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">{t('auth.last_name')}</label>
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            placeholder={t('auth.last_name')}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="auth-input pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">{t('auth.company')}</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        placeholder={t('auth.company_name')}
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
                                    {/* v1.0.1 - CNPJ Mask Hardening */}
                                    <input
                                        ref={cnpjRef}
                                        placeholder="00.000.000/0000-00"
                                        value={document}
                                        onChange={e => {
                                            const input = e.target;
                                            const start = input.selectionStart;
                                            const oldLength = input.value.length;
                                            
                                            const formatted = formatCNPJ(input.value);
                                            setDocument(formatted);

                                            // Path A: Manual Cursor Restoration
                                            setTimeout(() => {
                                                if (cnpjRef.current) {
                                                    const newLength = formatted.length;
                                                    const delta = newLength - oldLength;
                                                    const pos = (start || 0) + delta;
                                                    cnpjRef.current.setSelectionRange(pos, pos);
                                                }
                                            }, 0);
                                        }}
                                        className="auth-input pl-10"
                                        maxLength={18}
                                    />
                                </div>
                            </div>
                        </>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">{t('auth.email')}</label>
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
                        <label className="text-sm font-medium ml-1">{t('auth.password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="auth-input pl-10 pr-10"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div className="space-y-2 text-left">
                            <label className="text-sm font-medium ml-1">{t('auth.confirm_password')}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="auth-input pl-10 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                     <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? t('auth.signing_in') : (isRegistering ? t('auth.create_organization') : t('common.login'))}
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                        className="w-full py-4 px-6 border-2 border-primary/20 text-primary rounded-2xl font-bold text-lg hover:bg-primary/5 hover:border-primary/40 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isRegistering ? t('auth.back_to_login') : t('auth.create_account')}
                    </button>

                    {!isRegistering && (
                        <>
                            <div className="relative flex items-center gap-4 py-2">
                                <div className="h-px w-full bg-border" />
                                <span className="text-xs text-muted-foreground uppercase whitespace-nowrap">{t('auth.or_sign_in_with')}</span>
                                <div className="h-px w-full bg-border" />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    // Professional Routing: Ensure /api prefix regardless of env state
                                    const baseUrl = window.location.origin;
                                    window.location.href = `${baseUrl}/api/auth/google`;
                                }}
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
                                {t('auth.continue_with_google')}
                            </button>
                        </>
                    )}
                </form>

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
