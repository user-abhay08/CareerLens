import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

let gisScriptPromise = null;

function loadGoogleScript() {
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Google sign-in script'));
    document.head.appendChild(s);
  });
  return gisScriptPromise;
}

/**
 * "or continue with" divider + Google sign-in button.
 * Renders Google's official button when GOOGLE_CLIENT_ID is configured on
 * the server; until then it shows a one-time setup hint.
 */
export default function SocialLogin() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    fetch('/api/auth/oauth-config')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ google: false }));
  }, []);

  // Complete OAuth: exchange the provider token for our own session.
  const finishSocialLogin = async (provider, token) => {
    setError('');
    try {
      const data = await api('/auth/social', { method: 'POST', body: { provider, token } });
      loginWithToken(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  // Render the official Google button once config + script are ready.
  useEffect(() => {
    if (!config?.google || !googleBtnRef.current) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => finishSocialLogin('google', response.credential),
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 320,
        });
      })
      .catch(() => setError('Could not load Google sign-in. Check your connection.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.google]);

  const onUnconfiguredGoogleClick = () => {
    setError('');
    setHint('Google sign-in needs a one-time setup: create a free OAuth Client ID at console.cloud.google.com (Authorized JavaScript origin: http://localhost:5173) and add it as GOOGLE_CLIENT_ID in server/.env. See README.');
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400">or continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {error && <p className="banner-error mt-4">{error}</p>}
      {hint && <p className="banner-info mt-4">{hint}</p>}

      <div className="mt-4 grid gap-3">
        {config?.google ? (
          <div className="flex justify-center" ref={googleBtnRef} />
        ) : (
          <button type="button" onClick={onUnconfiguredGoogleClick} className="btn-secondary w-full !py-2.5">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>
        )}
      </div>
    </div>
  );
}
