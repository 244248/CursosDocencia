import gsap from 'gsap';

export const introTimeline = (elements) => {
  const {
    container,
    formPanel,
    illustrationPanel,
    logo,
    title,
    subtitle,
    inputs,
    buttons
  } = elements;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.set([formPanel, illustrationPanel], { opacity: 0, scale: 0.98 })
    .set(logo, { opacity: 0, y: 30 })
    .set(title, { opacity: 0, y: 20 })
    .set(subtitle, { opacity: 0, y: 15 })
    .set(inputs, { opacity: 0, y: 25 })
    .set(buttons, { opacity: 0, y: 20 });

  tl.to(illustrationPanel, {
    opacity: 1,
    scale: 1,
    duration: 1.2,
    ease: 'power2.out'
  }, 0)
  .to(formPanel, {
    opacity: 1,
    scale: 1,
    x: 0,
    duration: 1,
    ease: 'power3.out'
  }, 0.2)
  .to(logo, {
    opacity: 1,
    y: 0,
    duration: 0.8
  }, 0.5)
  .to(title, {
    opacity: 1,
    y: 0,
    duration: 0.6
  }, 0.7)
  .to(subtitle, {
    opacity: 1,
    y: 0,
    duration: 0.6
  }, 0.85)
  .to(inputs, {
    opacity: 1,
    y: 0,
    stagger: 0.1,
    duration: 0.5
  }, 1)
  .to(buttons, {
    opacity: 1,
    y: 0,
    stagger: 0.1,
    duration: 0.5
  }, 1.3);

  return tl;
};

export const preloaderTimeline = (elements) => {
  const { preloader, logo, text } = elements;

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  tl.set(preloader, { opacity: 1 })
    .to(logo, {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    }, 0.3)
    .to(text, {
      opacity: 1,
      y: 0,
      duration: 0.5
    }, 0.6)
    .to(preloader, {
      opacity: 0,
      duration: 0.5,
      delay: 0.4
    });

  return tl;
};

export const backgroundZoom = (element, duration = 20) => {
  return gsap.to(element, {
    scale: 1.1,
    duration,
    ease: 'none',
    repeat: -1,
    yoyo: true
  });
};
