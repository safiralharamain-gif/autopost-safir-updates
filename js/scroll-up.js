
let scrollUp = document.querySelector('.scrollUp')
let callUs   = document.querySelector('.call-us')

window.onscroll = function () {
  if (window.scrollY > 1050) {
    scrollUp.style.transform = 'translateY(0)';
    callUs.style.transform   = 'translateY(0)';
  } else {
    scrollUp.style.transform = 'translateY(200%)';
    callUs.style.transform   = 'translateY(59%)';
  }
}

scrollUp.onclick = () => {
  scrollTo(0, 0)
}