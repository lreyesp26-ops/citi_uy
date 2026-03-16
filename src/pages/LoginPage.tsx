import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // If already logged in, redirect to correct role dashboard
  useEffect(() => {
    if (user?.persona) {
      const from = (location.state as any)?.from?.pathname || 
                   (user.persona.rol === 'pastor' ? '/pastor/dashboard' : '/lider/dashboard');
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      if (rememberMe) {
        localStorage.removeItem('session_only');
      } else {
        localStorage.setItem('session_only', 'true');
        sessionStorage.setItem('active_tab', 'true');
      }
      
      // Note: We don't manually redirect here. 
      // The AuthContext will detect the session change, fetch the persona, 
      // update the user state, and then our useEffect above will redirect automatically.

    } catch (err) {
      if (err instanceof Error) {
        setError(
          err.message === 'Invalid login credentials' 
            ? 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.' 
            : 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.'
        );
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.');
      }
      setLoading(false); // Only stop loading if there's an error. On success wait for redirect
    } 
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-red-800 font-sans p-4">
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white px-6 py-2 rounded-lg mb-4 shadow-md">
            <h1 className="font-bold text-3xl tracking-wide">CENTI CITI</h1>
          </div>
          <h2 className="text-gray-700 font-medium text-lg leading-tight">Iglesia Cristiana Mundial</h2>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border-l-4 border-red-600 bg-red-50 flex items-start text-red-700 rounded-r-md">
            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Usuario, Correo o Cédula"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingresa tu correo"
            disabled={loading}
          />

          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Recordarme</label>
            </div>
            <a href="#" className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Button type="submit" fullWidth isLoading={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">© 2026 CENTI CITI - Iglesia Cristiana Mundial</p>
        </div>
      </div>
    </div>
  );
}
