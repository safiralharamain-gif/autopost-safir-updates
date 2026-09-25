
let sendButton      = document.querySelector('.send')
let cencelButton    = document.querySelector('.cencel')

let bookingTitle    = document.querySelector(".booking-title").textContent
let customerName    = document.getElementById("name")
let phone           = document.getElementById("phone")
let address         = document.getElementById("address")
let governorate     = document.getElementById("governorate")
let tripName        = document.getElementById("trip-name")
let finalTripName   = ''
let adultsCount     = document.getElementById("adults-count")
let childrenCount   = document.getElementById("children-count")
let msg             = document.getElementById("msg")

let day             = document.querySelector(".day")
let month           = document.querySelector(".month")
let year            = document.querySelector(".year")

let currentYear = new Date().getFullYear()
year.value = currentYear || year.value

function date() {
  let fullDate = day.value + ' / ' + month.value + ' / ' + year.value
  return fullDate
}

// room type
let roomType        = document.getElementsByName("room-type")
let roomTypeChecked = document.getElementById("four").nextElementSibling.textContent.trim()

// meals
let meals        = document.getElementsByName("meals")
let mealsChecked = document.getElementById("meals-no").nextElementSibling.textContent.trim()

// payment method
let paymentMethod   = document.getElementsByName("payment-method")
let paymentChecked  = document.getElementById("payment-cash").nextElementSibling.textContent.trim()

// who told you
let whoToldYou      = document.getElementsByName("who-told-you")
let whoChecked      = document.getElementById("friend").nextElementSibling.textContent.trim()

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

checkRadio(roomType, (newValue) => { roomTypeChecked = newValue })     // room type
checkRadio(meals, (newValue) => { mealsChecked = newValue })           // meals
checkRadio(paymentMethod, (newValue) => { paymentChecked = newValue }) // payment method
checkRadio(whoToldYou, (newValue) => { whoChecked = newValue })        // who told you


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
  الرحلة : ${tripName.value}%0a
  تاريخ الرحلة : ${date()}%0a
  عدد الأفراد (الكبار) : ${adultsCount.value}%0a
  عدد الأفراد (الصغار) : ${childrenCount.value}%0a
  نوع الغرفة : ${roomTypeChecked}%0a
  الوجبات : ${mealsChecked}%0a
  طريقة الدفع : ${paymentChecked}%0a
  رسالة / استفسار : ${msg.value}%0a
  مين بلغك بالرحلة : ${whoChecked}
  `
  window.open(whatsURL)
    
})


cencelButton.addEventListener("click", () => {
  customerName.value = ''
  phone.value = ''
  address.value = ''
  governorate.value = ''
  day.value = ''
  month.value = ''
  year.value = currentYear
  tripName.value = ''
  adultsCount.value = ''
  childrenCount.value = ''
  msg.value = ''
})