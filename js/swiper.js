const testimonialsSwiper = new Swiper('.testimonials-wrapper', {
  // Optional parameters
  // direction: 'vertical',
  autoplay: {
    delay: 5000,
  },
  loop: true,
  grabCursor: true,
  // spaceBetween: 40,

  // pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: true
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  breakpoints: {
    0: {
      slidesPerView: 1
    },
    
    999: {
      slidesPerView: 2
    },
  }

});

const addsSwiper = new Swiper('.adds-wrapper', {
  autoplay: {
    delay: 5000,
  },
  loop: true,
  grabCursor: true,
  // spaceBetween: 10,

  breakpoints: {
    0: {
      slidesPerView: 1
    },
    576: {
      slidesPerView: 2
    },
    1200: {
      slidesPerView: 3
    },
    1400: {
      slidesPerView: 4
    },
  }

});

const coLogosSwiper = new Swiper('.co-logos-wrapper', {
  autoplay: {
    delay: 5000,
  },
  loop: true,
  grabCursor: true,
  spaceBetween: 30,

  breakpoints: {
    0: {
      slidesPerView: 2
    },

    576: {
      slidesPerView: 3
    },
    
    1200: {
      slidesPerView: 4
    },
    
    1400: {
      slidesPerView: 5
    },
  }

});