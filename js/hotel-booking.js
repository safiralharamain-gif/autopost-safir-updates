
let sendButton         = document.querySelector('.send')
let cencelButton       = document.querySelector('.cencel')

let bookingTitle       = document.querySelector(".booking-title").textContent
let customerName       = document.getElementById("name")
let phone              = document.getElementById("phone")
let address            = document.getElementById("address")
let governorate        = document.getElementById("governorate")
let daysCount          = document.getElementById("days-count")
let hotelName          = document.getElementById("hotel-name")
let hotelLocation      = document.getElementById("hotel-location")
let hotelLevel         = document.getElementById("hotel-level")
let hotelLocationHaram = document.getElementById("hotel-location-from-haram")
let roomType           = document.getElementById("room-type")
let priceGreaterThan   = document.getElementById("price-greater_than")
let priceLessThan      = document.getElementById("price-less_than")

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
  تاريخ الحجز : ${date()}%0a
  عدد الأيام : ${parseInt(daysCount.value) + ' يوم'}%0a
  اسم الفندق أو ما يماثله : ${hotelName.value}%0a
  مكان الفندق : ${hotelLocation.textContent.trim()}%0a
  مستوى الفندق : ${hotelLevel.textContent.trim()}%0a
  موقع الفندق من الحرم : ${hotelLocationHaram.textContent.trim()}%0a
  نوع الغرفة : ${roomType.textContent.trim()}%0a
  سعر الغرفة
  أكبر من : ${priceGreaterThan.value} ريال
  وأقل من : ${priceLessThan.value} ريال

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
  daysCount.value = ''
  hotelName.value = ''
  hotelLocation.textContent = '*حدد مكان الفندق'
  hotelLevel.textContent = '*حدد مستوى الفندق'
  hotelLocationHaram.textContent = '*حدد موقع الفندق'
  roomType.textContent = '*حدد نوع الغرفة'
  priceGreaterThan.value = ''
  priceLessThan.value = ''
})