
let navTogglerBtn = document.querySelector('.navbar-toggler')
let navbarIcon = document.querySelector('.navbar-toggler-icon')

navTogglerBtn.addEventListener("click", () => {
  navbarIcon.classList.toggle('navbar-toggler-x-icon')
})
