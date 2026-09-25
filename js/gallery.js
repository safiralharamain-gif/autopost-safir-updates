// get all images
const url = './model/gallery.json'
const getData = async () => {
  let data = await fetch(url).then(response => response.json())
  return data
}

const gallerySection = document.querySelector('.gallery-section')
let tripTitle        = document.querySelector('.trip-title')

const section = ( async () => {
  await getData().then(data => { 
    let renderGallery = data.map(album => {
      tripTitle.textContent = album.title + ' ' + album.year
      return /*html*/`
        <div class="accordion accordion-gallery mt-3" id="accordion-images">

          <div class="accordion-item">

            <h2 class="accordion-header">
              <button class="accordion-button fs-5 lh-lg collapsed" type="button" data-bs-toggle="collapse"
                data-bs-target="#accordion-item-${album.id}" aria-expanded="true" aria-controls="accordion-item-${album.id}">
                <span class="mt-1">${album.title}</span>
                <span class="text-regular text-secondary mw-max-content mt-1 ms-2">${album.year}</span>
              </button>
            </h2>

            <div id="accordion-item-${album.id}" class="accordion-collapse collapse" data-bs-parent="#accordion-images">
              <div class="accordion-body">
                <div class="grid-container">

                  ${
                    album.imgs.map( img => {
                      return /*html*/`
                        <img src="./img/${img}"
                        class="photo cursor-pointer rounded-4 transition"
                        width="100%">
                      `
                    }).join('')
                  }

                </div>
              </div>
            </div>
          </div>
        </div>

      `
  })
    gallerySection.innerHTML = renderGallery.join('')
  })
  
})()

let gallerySlider = document.querySelector('.overlay')
let closeIcon     = document.querySelector('.close-icon')
let prevButton    = document.querySelector('.swiper-button-prev')
let nextButton    = document.querySelector('.swiper-button-next')
  
closeIcon.addEventListener("click", () => {
  // gallerySlider.style.transform = 'scale(0)'
  gallerySlider.style.display = 'none'
  document.body.style.overflow = 'auto'
})

document.onkeydown = function (e) {
  if (e.key === 'Escape') {
    gallerySlider.style.display = 'none'
    document.body.style.overflow = 'auto'  
  }
  if (e.key === 'ArrowRight') {
    prevButton.click()
  }
  if (e.key === 'ArrowLeft') {
    nextButton.click()
  }
}


document.addEventListener('click', function (e) {
  if (e.target.classList.contains('photo')) {
    // gallerySlider.style.transform = 'scale(1)'
    gallerySlider.style.display = 'block'
    document.body.style.overflow = 'hidden'
    setTimeout(() => {
      let swiperPagination = document.querySelector('.swiper-pagination')
      swiperPagination.childNodes[1].textContent = ' من '
    }, 10);

    let allPhotos = Array.from(e.target.parentElement.querySelectorAll('.photo'))
    let swiperWrapper = document.querySelector('.swiper-wrapper')
    let swiperPhotos = allPhotos.map(photo => {
      let imgSrc = photo.getAttribute('src');
      return /*html*/`
        <div class="swiper-slide">
          <img src="${imgSrc}" class="slide-photo rounded-5">
        </div>
      `
    })
    
    swiperWrapper.innerHTML = swiperPhotos.join('')

    let targetPhotoSrc = e.target.getAttribute('src');
    let initialSlide = 0
    let swiperSlides = document.querySelectorAll('.swiper-slide');
    swiperSlides.forEach((slide, index) => {
      let slideImgSrc = slide.querySelector('img').getAttribute('src');
      if (slideImgSrc === targetPhotoSrc) {
        initialSlide = index
      }
    });

    const swiper = new Swiper('.slider-wrapper', {
      initialSlide: initialSlide,
      grabCursor: true,
    
      // Navigation arrows
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: ".swiper-pagination",
        type: "fraction",
      },
    
      breakpoints: {
        0: {
          slidesPerView: 1
        }
      },
    
    })
    swiper.update()

  }
})