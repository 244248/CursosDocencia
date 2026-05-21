import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification, signOut, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { ref, get, update } from 'firebase/database';
import { auth, rtdb } from '../firebase/config';
import { useInstitution } from '../context/InstitutionContext';
import institutionConfigService from '../services/InstitutionConfigService';
import useInactivityWarning from '../hooks/useInactivityWarning';
import InactivityWarning from './InactivityWarning';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './styles/LoginDocente.css';

gsap.registerPlugin();

const LoginDocente = () => {
  const navigate = useNavigate();
  const { institutionName, logoUrl } = useInstitution();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);
  const formPanelRef = useRef(null);
  const illustrationRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const inputsRef = useRef([]);
  const buttonsRef = useRef([]);

  const { showWarning, timeLeft, extendSession } = useInactivityWarning(5, 1);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      localStorage.clear();
      navigate('/', { replace: true });
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'APPLY_CONFIG_PREVIEW') {
        const { config, interfaceSettings } = event.data;
        if (config && config.colors) {
          institutionConfigService.applyTheme(config.colors, interfaceSettings);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const sendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user);
      showMessage('Enlace de verificación enviado', 'success');
    } catch (error) {
      console.error('Error al enviar correo de verificación:', error);
      showMessage('Error al enviar enlace de verificación', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    setIsLoading(true);

    const btn = e.target.querySelector('.btn-primary');
    if (btn) {
      gsap.to(btn, { opacity: 0.7, scale: 0.98, duration: 0.2 });
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docentesRef = ref(rtdb, 'docentes');
      const snapshot = await get(docentesRef);
      let teacherData = null;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.email === user.email) {
            teacherData = data;
            teacherData.key = childSnapshot.key;
          }
        });
      }

      if (!teacherData) {
        await auth.signOut();
        showMessage('Usuario no registrado como docente', 'error');
        setIsLoading(false);
        return;
      }

      const isFirstLogin = teacherData.firstLogin !== false;

      if (isFirstLogin && !user.emailVerified) {
        await sendVerificationEmail(user);
        setShowVerifyModal(true);
      } else if (user.emailVerified) {
        if (isFirstLogin) {
          await update(ref(rtdb, `docentes/${teacherData.key}`), { firstLogin: false });
        }
        showMessage('Inicio de sesión exitoso', 'success');
        localStorage.setItem('teacherKey', teacherData.key);

        if (btn) {
          gsap.to(btn, { opacity: 1, scale: 1, duration: 0.2 });
        }

        setTimeout(() => {
          navigate('/docente');
        }, 1000);
      } else {
        showMessage('Por favor, verifica tu correo electrónico', 'error');
        await sendVerificationEmail(user);
        setShowVerifyModal(true);
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      let errorMessage = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Correo o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      }
      showMessage(errorMessage, 'error');
    }

    setIsLoading(false);
  };

  const checkVerification = async () => {
    try {
      await auth.currentUser.reload();
      const user = auth.currentUser;
      if (user.emailVerified) {
        const docentesRef = ref(rtdb, 'docentes');
        const snapshot = await get(docentesRef);
        let teacherData = null;

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if (data.email === user.email) {
              teacherData = data;
              teacherData.key = childSnapshot.key;
            }
          });
        }

        if (teacherData) {
          await update(ref(rtdb, `docentes/${teacherData.key}`), { firstLogin: false });
          setShowVerifyModal(false);
          showMessage('Correo verificado. Inicio de sesión exitoso', 'success');
          localStorage.setItem('teacherKey', teacherData.key);
          setTimeout(() => {
            navigate('/docente');
          }, 1000);
        } else {
          showMessage('Usuario no registrado como docente', 'error');
          await auth.signOut();
        }
      } else {
        showMessage('Aún no has verificado tu correo', 'error');
      }
    } catch (error) {
      console.error('Error al verificar correo:', error);
      showMessage('Error al verificar correo', 'error');
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendVerificationEmail(auth.currentUser);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docentesRef = ref(rtdb, 'docentes');
      const snapshot = await get(docentesRef);
      let teacherData = null;

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.email === user.email) {
            teacherData = data;
            teacherData.key = childSnapshot.key;
          }
        });
      }

      if (!teacherData) {
        await auth.signOut();
        showMessage('Usuario no registrado como docente', 'error');
        setIsLoading(false);
        return;
      }

      showMessage('Inicio de sesión exitoso con Microsoft', 'success');
      localStorage.setItem('teacherKey', teacherData.key);
      setTimeout(() => {
        navigate('/docente');
      }, 1000);
    } catch (error) {
      console.error('Error al iniciar sesión con Microsoft:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        showMessage('Inicio de sesión cancelado', 'error');
      } else {
        showMessage('Error al iniciar sesión con Microsoft', 'error');
      }
    }
    setIsLoading(false);
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.set(formPanelRef.current, { opacity: 0, x: -50 })
      .set(illustrationRef.current, { opacity: 0, scale: 1.05 })
      .set([logoRef.current, titleRef.current, subtitleRef.current], { opacity: 0, y: 30 })
      .set(inputsRef.current, { opacity: 0, y: 25 })
      .set(buttonsRef.current, { opacity: 0, y: 20 });

    tl.to(illustrationRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, 0)
    .to(formPanelRef.current, {
      opacity: 1,
      x: 0,
      duration: 1,
      ease: 'power3.out'
    }, 0.2)
    .to([logoRef.current, titleRef.current, subtitleRef.current], {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.6
    }, 0.5)
    .to(inputsRef.current, {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.5
    }, 0.9)
    .to(buttonsRef.current, {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.5
    }, 1.2);

    const inputs = inputsRef.current;
    inputs.forEach(input => {
      if (input) {
        const inputEl = input.querySelector('input');
        input.addEventListener('mouseenter', () => {
          gsap.to(inputEl, { scale: 1.01, duration: 0.3, ease: 'power2.out' });
        });
        input.addEventListener('mouseleave', () => {
          gsap.to(inputEl, { scale: 1, duration: 0.3, ease: 'power2.out' });
        });
      }
    });

    const buttons = buttonsRef.current;
    buttons.forEach(btn => {
      if (btn) {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { y: -3, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { y: 0, duration: 0.3, ease: 'power2.out' });
        });
      }
    });

  }, { scope: containerRef });

  return (
    <>
      <div className="login-container" ref={containerRef}>
        <div className="login-illustration-panel" ref={illustrationRef}>
          <div className="particles-container">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
          <div className="decorative-element top-left"></div>
          <div className="decorative-element bottom-right"></div>
        </div>

        <div className="login-form-panel" ref={formPanelRef}>
          <div className="login-header">
            <div className="logo-container" ref={logoRef}>
              <img
                src={logoUrl || "https://lasalleneza.btl.mx/wp-content/uploads/2024/02/WhatsAppLaSalleNeza.jpg"}
                alt={`Logo ${institutionName || 'Universidad'}`}
                className="logo"
              />
            </div>
            <p className="institution-name-subtitle" ref={subtitleRef}>{institutionName || 'Universidad La Salle Nezahualcóyotl'}</p>
            <h2 ref={titleRef}>Bienvenido Docente</h2>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group" ref={el => inputsRef.current[0] = el}>
              <label htmlFor="email">Correo Electrónico</label>
              <input type="email" id="email" required placeholder="ejemplo@lasalle.edu.mx" />
            </div>
            <div className="form-group" ref={el => inputsRef.current[1] = el}>
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" ref={el => buttonsRef.current[0] = el} disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            <div className="divider">
              <span>o</span>
            </div>
            <button type="button" className="btn btn-microsoft" onClick={handleMicrosoftLogin} disabled={isLoading}>
              <svg className="ms-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                <path fill="#7fba00" d="M12 1h10v10H12z"/>
                <path fill="#ffb900" d="M12 12h10v10H12z"/>
              </svg>
              Continuar con Microsoft
            </button>
          </form>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <button className="btn back-btn" onClick={() => navigate('/')} ref={el => buttonsRef.current[1] = el}>
            Volver
          </button>
        </div>
      </div>

      {showVerifyModal && (
        <div className="modal show">
          <div className="modal-content">
            <span className="close" onClick={() => setShowVerifyModal(false)}>×</span>
            <h3>Verificación de Correo</h3>
            <p>Se ha enviado un enlace de verificación a tu correo electrónico. Por favor, verifica tu correo para continuar.</p>
            <button onClick={checkVerification} className="btn btn-primary">He Verificado Mi Correo</button>
            <button onClick={resendVerification} className="btn back-btn" style={{ marginTop: '10px' }}>Reenviar Enlace</button>
          </div>
        </div>
      )}

      <InactivityWarning
        show={showWarning}
        timeLeft={timeLeft}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
    </>
  );
};

export default LoginDocente;
