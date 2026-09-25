
setTimeout(() => {
  const detailsSwiper = new Swiper('.slider-wrapper', {
    // Optional parameters
    // direction: 'vertical',
    autoplay: {
      delay: 5000,
    },
    loop: true,
    grabCursor: true,
    spaceBetween: 40,

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
      }
    }

  });
}, 600);