import gsap from 'gsap';

export const createParallax = (elements, options = {}) => {
  const {
    speed = 0.5,
    smooth = 0.1
  } = options;

  let currentY = 0;
  let targetY = 0;
  let rafId = null;

  const updateParallax = () => {
    currentY += (targetY - currentY) * smooth;

    elements.forEach((el, i) => {
      const depth = (i + 1) * speed * 0.1;
      gsap.set(el, { y: currentY * depth });
    });

    rafId = requestAnimationFrame(updateParallax);
  };

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    targetY = ((clientY - innerHeight / 2) / innerHeight) * 20;
  };

  window.addEventListener('mousemove', handleMouseMove);
  updateParallax();

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
  };
};

export const floatElement = (element, options = {}) => {
  const {
    yRange = 10,
    xRange = 5,
    duration = 3,
    delay = 0
  } = options;

  return gsap.to(element, {
    y: yRange,
    x: xRange,
    duration,
    delay,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  });
};

export const subtleParallax = (element, speed = 0.3) => {
  let currentScroll = 0;
  let targetScroll = 0;

  const handleScroll = () => {
    targetScroll = window.scrollY;
  };

  const updateScroll = () => {
    currentScroll += (targetScroll - currentScroll) * 0.1;

    gsap.set(element, {
      y: currentScroll * speed,
      force3D: true
    });

    requestAnimationFrame(updateScroll);
  };

  window.addEventListener('scroll', handleScroll);
  updateScroll();

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};

export const rotateElement = (element, options = {}) => {
  const {
    degrees = 5,
    duration = 4,
    delay = 0
  } = options;

  return gsap.to(element, {
    rotation: degrees,
    duration,
    delay,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    transformOrigin: 'center center'
  });
};

export const scaleParallax = (element, speed = 0.2) => {
  gsap.to(element, {
    scale: 1 + speed,
    duration: 10,
    ease: 'none',
    repeat: -1,
    yoyo: true
  });
};
