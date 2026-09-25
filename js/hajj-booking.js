
let sendButton      = document.querySelector('.send')
let cencelButton    = document.querySelector('.cencel')

let bookingTitle    = document.querySelector(".booking-title").textContent
let customerName    = document.getElementById("name")
let phone           = document.getElementById("phone")
let address         = document.getElementById("address")
let governorate     = document.getElementById("governorate")
let tripName        = document.getElementById("trip-name")
let msg             = document.getElementById("msg")

// meals
let meals        = document.getElementsByName("meals")
let mealsChecked = document.getElementById("meals-no").nextElementSibling.textContent.trim()

function checkRadio(nameAttr, updateCallback) {
  nameAttr.forEach(selected => {
    selected.addEventListener('change', (e) => {
      nameAttr.forEach( uncheck => { 
        uncheck.removeAttribute('checked')
      })
      e.target.setAttribute('checked', '')
      updateCallback( e.target.nextElementSibling.textContent.trim() )
    })
  })
}

checkRadio(meals, (newValue) => { mealsChecked = newValue }) // meals

let options = document.querySelectorAll('.dropdown-item')

options.forEach( option => {
  option.addEventListener('click', e => {
    let select = e.target.parentElement.parentElement.querySelector('.select')
    select.textContent = e.target.textContent.trim()
  })
})

sendButton.addEventListener("click", () => {

  let whatsURL = `https://wa.me/+201150337383?text=
  ${bookingTitle}%0a
  الاسم : ${customerName.value}%0a
  الموبايل : ${phone.value}%0a
  العنوان : ${address.value}%0a
  المحافظة : ${governorate.value}%0a
  نوح الحج : ${tripName.textContent.trim()}%0a
  هل قمت بالحج من قبل ؟ : ${mealsChecked}%0a
  رسالة / استفسار : ${msg.value}%0a
  `
  window.open(whatsURL)
    
})


cencelButton.addEventListener("click", () => {
  customerName.value = ''
  phone.value = ''
  address.value = ''
  governorate.value = ''
  tripName.textContent = '*حدد نوع الحـج'
  msg.value = ''
})