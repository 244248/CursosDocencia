import gsap from 'gsap';

export const fadeOut = (element, onComplete) => {
  return gsap.to(element, {
    opacity: 0,
    filter: 'blur(8px)',
    duration: 0.4,
    ease: 'power2.inOut',
    onComplete
  });
};

export const fadeIn = (element) => {
  return gsap.fromTo(element,
    { opacity: 0, filter: 'blur(8px)' },
    {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out'
    }
  );
};

export const slideOut = (element, direction = 'left') => {
  const vars = {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.inOut'
  };

  if (direction === 'left') {
    vars.x = -50;
  } else if (direction === 'right') {
    vars.x = 50;
  } else if (direction === 'up') {
    vars.y = -50;
  } else {
    vars.y = 50;
  }

  return gsap.to(element, vars);
};

export const slideIn = (element, direction = 'right') => {
  const vars = {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.out'
  };

  if (direction === 'left') {
    vars.x = 0;
  } else if (direction === 'right') {
    vars.x = 0;
  } else if (direction === 'up') {
    vars.y = 0;
  } else {
    vars.y = 0;
  }

  gsap.set(element, { x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0 });
  gsap.set(element, { y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0 });

  return gsap.to(element, vars);
};

export const routeExit = (elements, onComplete) => {
  const tl = gsap.timeline({ onComplete });

  elements.forEach((el, i) => {
    tl.to(el, {
      opacity: 0,
      y: -20,
      filter: 'blur(4px)',
      duration: 0.3,
      ease: 'power2.inOut'
    }, i * 0.05);
  });

  return tl;
};

export const routeEnter = (elements) => {
  const tl = gsap.timeline();

  elements.forEach((el, i) => {
    tl.fromTo(el,
      { opacity: 0, y: 30, filter: 'blur(4px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: 'power2.out'
      }, i * 0.08);
  });

  return tl;
};

export const revealStagger = (elements, container) => {
  gsap.set(container, { opacity: 1 });

  return gsap.fromTo(elements,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: 'power2.out'
    }
  );
};

export const glowPulse = (element, color1 = '#0072ce', color2 = '#ce0e2d') => {
  const tl = gsap.timeline({ repeat: -1, yoyo: true });

  tl.to(element, {
    boxShadow: `0 0 20px ${color1}, 0 0 40px ${color2}`,
    duration: 2,
    ease: 'sine.inOut'
  });

  return tl;
};

export const lightSweep = (element) => {
  gsap.set(element, { overflow: 'hidden' });

  const sweep = gsap.timeline({ repeat: -1 });

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: skewX(-20deg);
  `;
  element.appendChild(overlay);

  sweep.to(overlay, {
    left: '200%',
    duration: 3,
    ease: 'power2.inOut'
  });

  return sweep;
};
