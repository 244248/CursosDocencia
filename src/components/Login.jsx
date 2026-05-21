import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, OAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, set, get } from 'firebase/database';
import { auth, db, rtdb } from '../firebase/config';
import { useInstitution } from '../context/InstitutionContext';
import institutionConfigService from '../services/InstitutionConfigService';
import DualWriteService from '../services/DualWriteService';
import useInactivityWarning from '../hooks/useInactivityWarning';
import InactivityWarning from './InactivityWarning';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './styles/Login.css';

gsap.registerPlugin();

const Login = () => {
  const navigate = useNavigate();
  const { institutionName, logoUrl } = useInstitution();
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
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
    }, 4000);
  };

  const handleAuthError = (error) => {
    let errorMessage = "Error en la autenticación";
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "El correo ya está registrado";
        break;
      case "auth/invalid-email":
        errorMessage = "Correo electrónico inválido";
        break;
      case "auth/weak-password":
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
        break;
      case "auth/wrong-password":
        errorMessage = "Contraseña incorrecta";
        break;
      case "auth/user-not-found":
        errorMessage = "Usuario no encontrado";
        break;
      case "auth/too-many-requests":
        errorMessage = "Demasiados intentos. Intenta de nuevo más tarde";
        break;
      case "auth/operation-not-allowed":
        errorMessage = "Registro de usuarios no permitido";
        break;
      case "auth/network-request-failed":
        errorMessage = "Error de red. Verifica tu conexión";
        break;
      default:
        errorMessage = `Error: ${error.message}`;
    }
    showMessage(errorMessage, "error");
  };

  const getRoleFromEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'ulsaneza.edu.mx') return 'docente';
    return 'admin';
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

  const handleRegister = async (e) => {
    e.preventDefault();
    const email = e.target.regEmail.value;
    const name = e.target.regName.value;
    const lastName = e.target.regLastName.value;
    const password = e.target.regPassword.value;
    const confirmPassword = e.target.regConfirmPassword.value;

    if (!email || !name || !lastName || !password || !confirmPassword) {
      showMessage("Por favor, completa todos los campos", "error");
      return;
    }
    if (password !== confirmPassword) {
      showMessage("Las contraseñas no coinciden", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const adminData = {
        email: email,
        nombre: name,
        apellidos: lastName,
        rol: 'administrador',
        fechaRegistro: new Date().toISOString(),
        uid: user.uid
      };
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await setDoc(doc(db, 'administradores', user.uid), adminData);
      await set(ref(rtdb, 'administradores/' + sanitizedName), adminData);
      DualWriteService.saveAdmin(sanitizedName, adminData);
      showMessage("Registro exitoso. Ahora puedes iniciar sesión.", "success");
      e.target.reset();
      setShowRegister(false);
    } catch (error) {
      console.error("Error en registro:", error);
      handleAuthError(error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    setIsLoading(true);

    const btn = e.target.querySelector('.btn-primary');
    if (btn) gsap.to(btn, { opacity: 0.7, scale: 0.98, duration: 0.2 });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const role = getRoleFromEmail(user.email);

      if (role === 'docente') {
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
        localStorage.setItem('teacherKey', teacherData.key);
        navigate('/docente');
      } else {
        const adminsRef = ref(rtdb, 'administradores');
        const snapshot = await get(adminsRef);
        let isAdmin = false;
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const adminData = childSnapshot.val();
            if (adminData.email === email && adminData.rol === 'administrador') {
              isAdmin = true;
            }
          });
        }
        if (isAdmin) {
          navigate('/admin');
        } else {
          await auth.signOut();
          showMessage("No tienes permisos de administrador", "error");
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      handleAuthError(error);
    }
    setIsLoading(false);
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const role = getRoleFromEmail(user.email);

      if (role === 'docente') {
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
        localStorage.setItem('teacherKey', teacherData.key);
        showMessage('Inicio de sesión exitoso con Microsoft', 'success');
        setTimeout(() => navigate('/docente'), 1000);
      } else {
        const adminsRef = ref(rtdb, 'administradores');
        const snapshot = await get(adminsRef);
        let isAdmin = false;
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const adminData = childSnapshot.val();
            if (adminData.email === user.email && adminData.rol === 'administrador') {
              isAdmin = true;
            }
          });
        }
        if (isAdmin) {
          showMessage('Inicio de sesión exitoso con Microsoft', 'success');
          setTimeout(() => navigate('/admin'), 1000);
        } else {
          await auth.signOut();
          showMessage('No tienes permisos de administrador', 'error');
        }
      }
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

    tl.to(illustrationRef.current, { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
      .to(formPanelRef.current, { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }, 0.2)
      .to([logoRef.current, titleRef.current, subtitleRef.current], { opacity: 1, y: 0, stagger: 0.1, duration: 0.6 }, 0.5)
      .to(inputsRef.current, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, 0.9)
      .to(buttonsRef.current, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, 1.2);

    inputsRef.current.forEach(input => {
      if (input) {
        const inputEl = input.querySelector('input');
        input.addEventListener('mouseenter', () => gsap.to(inputEl, { scale: 1.01, duration: 0.3, ease: 'power2.out' }));
        input.addEventListener('mouseleave', () => gsap.to(inputEl, { scale: 1, duration: 0.3, ease: 'power2.out' }));
      }
    });
    buttonsRef.current.forEach(btn => {
      if (btn) {
        btn.addEventListener('mouseenter', () => gsap.to(btn, { y: -3, duration: 0.3, ease: 'power2.out' }));
        btn.addEventListener('mouseleave', () => gsap.to(btn, { y: 0, duration: 0.3, ease: 'power2.out' }));
      }
    });
  }, { scope: containerRef });

  return (
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
            <img src={logoUrl || "https://lasalleneza.btl.mx/wp-content/uploads/2024/02/WhatsAppLaSalleNeza.jpg"} alt={`Logo ${institutionName || 'Universidad'}`} className="logo" />
          </div>
          <h2 ref={titleRef}>Bienvenido</h2>
          <p className="institution-name" ref={subtitleRef}>{institutionName || 'Universidad La Salle Nezahualcóyotl'}</p>
        </div>

        {!showRegister ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group" ref={el => inputsRef.current[0] = el}>
              <label htmlFor="email">Correo Electrónico</label>
              <input type="email" id="email" required placeholder="tu.correo@dominio.com" />
            </div>
            <div className="form-group" ref={el => inputsRef.current[1] = el}>
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input type={showPassword ? "text" : "password"} id="password" required placeholder="••••••••" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" ref={el => buttonsRef.current[0] = el} disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            <div className="divider"><span>o</span></div>
            <button type="button" className="btn btn-microsoft" onClick={handleMicrosoftLogin} disabled={isLoading}>
              <svg className="ms-icon" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#00a4ef" d="M1 12h10v10H1z" />
                <path fill="#7fba00" d="M12 1h10v10H12z" />
                <path fill="#ffb900" d="M12 12h10v10H12z" />
              </svg>
              Continuar con Microsoft
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="login-header"><h2>Registro Administrador</h2></div>
            <div className="form-group" ref={el => inputsRef.current[2] = el}>
              <label htmlFor="regEmail">Correo electrónico</label>
              <input type="email" id="regEmail" required placeholder="ejemplo@gmail.com" />
            </div>
            <div className="form-group" ref={el => inputsRef.current[3] = el}>
              <label htmlFor="regName">Nombre</label>
              <input type="text" id="regName" required placeholder="Tu nombre" />
            </div>
            <div className="form-group" ref={el => inputsRef.current[4] = el}>
              <label htmlFor="regLastName">Apellidos</label>
              <input type="text" id="regLastName" required placeholder="Tus apellidos" />
            </div>
            <div className="form-group" ref={el => inputsRef.current[5] = el}>
              <label htmlFor="regPassword">Contraseña (mínimo 6 caracteres)</label>
              <div className="password-input-wrapper">
                <input type={showRegPassword ? "text" : "password"} id="regPassword" minLength="6" required placeholder="••••••••" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowRegPassword(!showRegPassword)} aria-label={showRegPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <i className={`fas ${showRegPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <div className="form-group" ref={el => inputsRef.current[6] = el}>
              <label htmlFor="regConfirmPassword">Confirmar Contraseña</label>
              <div className="password-input-wrapper">
                <input type={showRegConfirmPassword ? "text" : "password"} id="regConfirmPassword" minLength="6" required placeholder="••••••••" />
                <button type="button" className="password-toggle-btn" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} aria-label={showRegConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  <i className={`fas ${showRegConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Registrarse</button>
          </form>
        )}

        <p className="toggle-form-text">
          {!showRegister ? (
            <>¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>Regístrate</a></>
          ) : (
            <>¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(false); }}>Iniciar Sesión</a></>
          )}
        </p>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <button className="btn back-btn" onClick={() => navigate('/')} ref={el => buttonsRef.current[1] = el}>Volver</button>
      </div>

      <InactivityWarning show={showWarning} timeLeft={timeLeft} onExtend={extendSession} onLogout={handleLogout} />
    </div>
  );
};

export default Login;