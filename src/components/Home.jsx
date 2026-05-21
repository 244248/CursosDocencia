import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitution } from '../context/InstitutionContext';
import './styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { institutionName, logoUrl } = useInstitution();
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.opacity = '0';
      cardRef.current.style.transform = 'translateY(30px)';
      setTimeout(() => {
        cardRef.current.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        cardRef.current.style.opacity = '1';
        cardRef.current.style.transform = 'translateY(0)';
      }, 100);
    }
  }, []);

  return (
    <div className="home-container">
      <div className="home-bg-particles">
        <div className="bg-particle p1"></div>
        <div className="bg-particle p2"></div>
        <div className="bg-particle p3"></div>
        <div className="bg-particle p4"></div>
        <div className="bg-particle p5"></div>
        <div className="bg-particle p6"></div>
      </div>
      
      <div className="home-card" ref={cardRef}>
        <div className="home-card-left">
          <div className="home-media-luna"></div>
        </div>
        
        <div className="home-card-right">
          <div className="home-card-content">
            <div className="logo-container">
              <img 
                src={logoUrl || "https://lasalleneza.btl.mx/wp-content/uploads/2024/02/WhatsAppLaSalleNeza.jpg"} 
                alt="Logo Universidad" 
                className="home-logo" 
              />
            </div>
            
            <h1 className="home-title">Universidad La Salle</h1>
            <p className="home-motto">Indivisa Manent</p>
            
            <button className="btn-iniciar-sesion" onClick={() => navigate('/login')}>
              <span className="btn-icon"><i className="fas fa-sign-in-alt"></i></span>
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;