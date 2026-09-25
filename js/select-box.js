
let options = document.querySelectorAll('.dropdown-item')

options.forEach( option => {
  option.addEventListener('click', e => {
    let select = e.target.parentElement.parentElement.querySelector('.select')
    select.textContent = e.target.textContent.trim()
  })
})