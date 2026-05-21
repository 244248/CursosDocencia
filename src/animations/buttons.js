import gsap from 'gsap';

export const buttonHover = (button) => {
  gsap.to(button, {
    scale: 1.02,
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const buttonLeave = (button) => {
  gsap.to(button, {
    scale: 1,
    duration: 0.3,
    ease: 'power2.out'
  });
};

export const buttonClick = (button) => {
  const tl = gsap.timeline();
  tl.to(button, {
    scale: 0.97,
    duration: 0.1,
    ease: 'power2.in'
  })
  .to(button, {
    scale: 1,
    duration: 0.3,
    ease: 'back.out(2)'
  });
  return tl;
};

export const buttonGlow = (button) => {
  gsap.to(button, {
    boxShadow: '0 0 30px rgba(0, 114, 206, 0.4), 0 0 60px rgba(206, 14, 45, 0.2)',
    duration: 0.4,
    ease: 'power2.out'
  });
};

export const buttonGlowLeave = (button) => {
  gsap.to(button, {
    boxShadow: '0 4px 15px rgba(206, 14, 45, 0.3)',
    duration: 0.4,
    ease: 'power2.out'
  });
};

export const loadingState = (button, isLoading) => {
  if (isLoading) {
    gsap.to(button, {
      opacity: 0.7,
      scale: 0.98,
      duration: 0.3
    });
  } else {
    gsap.to(button, {
      opacity: 1,
      scale: 1,
      duration: 0.3
    });
  }
};

export const animateButtonIn = (button, delay = 0) => {
  gsap.fromTo(button,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay,
      ease: 'power2.out'
    }
  );
};
