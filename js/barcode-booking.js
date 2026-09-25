
let sendButton      = document.querySelector('.send')
let cencelButton    = document.querySelector('.cencel')

let bookingTitle    = document.querySelector(".booking-title").textContent
let customerName    = document.getElementById("name")
let phone           = document.getElementById("phone")
let address         = document.getElementById("address")
let governorate     = document.getElementById("governorate")
let serviceType     = document.querySelector(".booking-form .service-type")

let day             = document.querySelector(".day")
let month           = document.querySelector(".month")
let year            = document.querySelector(".year")

let currentYear = new Date().getFullYear()
year.value = currentYear || year.value

function date() {
  let fullDate = day.value + ' / ' + month.value + ' / ' + year.value
  return fullDate
}

sendButton.addEventListener("click", () => {

  let whatsURL = `https://wa.me/+201150337383?text=
  ${bookingTitle}%0a
  الاسم : ${customerName.value}%0a
  الموبايل : ${phone.value}%0a
  العنوان : ${address.value}%0a
  المحافظة : ${governorate.value}%0a
  نوع الخدمة : ${serviceType.textContent.trim()}%0a
  تاريخ السفر : ${date()}
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
  serviceType.textContent = '*حدد نوع الخدمة'
})
