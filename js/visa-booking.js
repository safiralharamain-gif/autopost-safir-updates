
let sendButton      = document.querySelector('.send')
let cencelButton    = document.querySelector('.cencel')

let bookingTitle    = document.querySelector(".booking-title").textContent
let customerName    = document.getElementById("name")
let phone           = document.getElementById("phone")
let address         = document.getElementById("address")
let governorate     = document.getElementById("governorate")
let countryVisa     = document.querySelector(".booking-form .select-country")
let visaType        = document.querySelector(".booking-form .select-type")
let visaDuration    = document.querySelector(".booking-form .select-duration")

sendButton.addEventListener("click", () => {
  
  let whatsURL = `https://wa.me/+201150337383?text=
  ${bookingTitle}%0a
  الاسم : ${customerName.value}%0a
  الموبايل : ${phone.value}%0a
  العنوان : ${address.value}%0a
  المحافظة : ${governorate.value}%0a
  تأشيرة دولة : ${countryVisa.textContent.trim()}%0a
  نوع التأشيرة : ${visaType.textContent.trim()}%0a
  مدة التأشيرة : ${visaDuration.textContent.trim()}
  `
  window.open(whatsURL)
  
})

cencelButton.addEventListener("click", () => {
  customerName.value = ''
  phone.value = ''
  address.value = ''
  governorate.value = ''
  countryVisa.textContent = '*حدد اسم الدولة'
  visaType.textContent = '*حدد نوع التأشيرة'
  visaDuration.textContent = '*حدد مدة التأشيرة'
})