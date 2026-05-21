import gsap from 'gsap';

export const inputHover = (input) => {
  gsap.to(input, {
    scale: 1.01,
    boxShadow: '0 4px 20px rgba(0, 70, 132, 0.15)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const inputLeave = (input) => {
  gsap.to(input, {
    scale: 1,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const inputFocus = (inputGroup) => {
  gsap.to(inputGroup, {
    borderColor: 'rgba(0, 114, 206, 0.5)',
    boxShadow: '0 0 0 4px rgba(0, 114, 206, 0.1), 0 4px 12px rgba(0, 114, 206, 0.15)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const inputBlur = (inputGroup) => {
  gsap.to(inputGroup, {
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const inputError = (inputGroup) => {
  const tl = gsap.timeline();
  tl.to(inputGroup, {
    x: -10,
    duration: 0.08,
    ease: 'power2.inOut'
  })
  .to(inputGroup, {
    x: 10,
    duration: 0.08,
    ease: 'power2.inOut'
  })
  .to(inputGroup, {
    x: -6,
    duration: 0.08,
    ease: 'power2.inOut'
  })
  .to(inputGroup, {
    x: 6,
    duration: 0.08,
    ease: 'power2.inOut'
  })
  .to(inputGroup, {
    x: 0,
    duration: 0.08,
    ease: 'power2.out'
  });
  return tl;
};

export const inputErrorGlow = (input) => {
  gsap.to(input, {
    boxShadow: '0 0 20px rgba(206, 14, 45, 0.4)',
    borderColor: 'rgba(206, 14, 45, 0.6)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const inputClearError = (input) => {
  gsap.to(input, {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    borderColor: '#e2e8f0',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const animateInputIn = (input, delay = 0) => {
  gsap.fromTo(input,
    { opacity: 0, y: 25 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay,
      ease: 'power2.out'
    }
  );
};

export const iconIlluminate = (icon) => {
  gsap.to(icon, {
    color: '#0072ce',
    textShadow: '0 0 10px rgba(0, 114, 206, 0.5)',
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const iconDim = (icon) => {
  gsap.to(icon, {
    color: '#64748b',
    textShadow: 'none',
    duration: 0.3,
    ease: 'power2.out'
  });
};
