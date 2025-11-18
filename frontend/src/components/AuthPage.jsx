import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../api';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../translations';
import logoImage from '../assets/logotp.png';

const AuthPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError(t('passwordsDoNotMatch'));
        return;
      }
      
      const response = isLogin 
        ? await auth.login({ email: formData.email, password: formData.password })
        : await auth.register({ username: formData.username, email: formData.email, password: formData.password });
      
      login(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || (isLogin ? t('loginFailed') : t('signupFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"SF Pro Display", -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '400px' : 'var(--modal-max-width, 1200px)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: isMobile ? 'auto' : '600px'
      }}>
        {/* Left Side - Branding */}
        <div style={{
          flex: isMobile ? 'none' : '1',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          padding: isMobile ? '40px 30px' : '60px 50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'relative', zIndex: 1 }}
          >
            {/* Logo */}
            <div style={{
              width: isMobile ? '80px' : '120px',
              height: isMobile ? '80px' : '120px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              margin: '0 auto 24px auto'
            }}>
              <img 
                src={logoImage} 
                alt="AssetFlow Logo" 
                style={{
                  width: isMobile ? '50px' : '70px',
                  height: isMobile ? '50px' : '70px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div style="font-size: 32px; font-weight: 800; color: white;">AF</div>';
                }}
              />
            </div>
            
            <h1 style={{
              fontSize: isMobile ? '28px' : 'var(--font-4xl, 36px)',
              fontWeight: '800',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              AssetFlow
            </h1>
            
            <div style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '16px'
            }}>
              {t('enterpriseGrade')}
            </div>
            
            <div style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              {t('inventoryManagement')}
            </div>
            
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              opacity: 0.9,
              lineHeight: '1.6',
              margin: '0 0 32px 0',
              maxWidth: '300px'
            }}>
              {t('modernSolution')}
            </p>
          </motion.div>
        </div>

        {/* Right Side - Form */}
        <div style={{
          flex: isMobile ? 'none' : '1',
          padding: isMobile ? '40px 30px' : '60px 50px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 style={{
              fontSize: isMobile ? '24px' : 'var(--font-3xl, 32px)',
              fontWeight: '800',
              color: '#0f172a',
              margin: '0 0 8px 0'
            }}>
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </h2>
            
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: '0 0 32px 0'
            }}>
              {isLogin ? 'Sign in to your account' : t('getStarted')}
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: '20px' }}
                >
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder={t('enterUsername')}
                    value={formData.username}
                    onChange={handleChange}
                    required={!isLogin}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </motion.div>
              )}

              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              
              <div style={{ marginBottom: !isLogin ? '20px' : '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {t('password')}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: '24px' }}
                >
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder={t('confirmPassword')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </motion.div>
              )}

              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }}
                >
                  {error}
                </motion.div>
              )}

              
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '24px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {loading 
                  ? (isLogin ? t('loggingIn') : t('signingUp'))
                  : (isLogin ? t('login') : t('signup'))
                }
              </button>
            </form>
            
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#64748b'
            }}>
              {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}
              {' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'student' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                {isLogin ? t('signUpHere') : t('loginHere')}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;