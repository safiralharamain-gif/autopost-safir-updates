
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

// booking type
let bookType        = document.getElementsByName("book-type")
let bookTypeChecked = document.getElementById("normal").nextElementSibling.textContent.trim()

// booking seat
let bookSeat        = document.getElementsByName("book-seat")
let seatChecked     = document.getElementById("seat-yes").nextElementSibling.textContent.trim()

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

checkRadio(bookType, (newValue) => { bookTypeChecked = newValue })     // booking type
checkRadio(bookSeat, (newValue) => { seatChecked = newValue })         // booking seat
checkRadio(paymentMethod, (newValue) => { paymentChecked = newValue }) // payment method
checkRadio(whoToldYou, (newValue) => { whoChecked = newValue })        // who told you


let options = document.querySelectorAll('.dropdown-item')

options.forEach( option => {
  option.addEventListener('click', e => {
    let select = e.target.parentElement.parentElement.querySelector('.select')
    select.textContent = e.target.textContent.trim()
    finalTripName = e.target.textContent.trim()
    if (finalTripName == 'رحلة السيــرك') {
      document.querySelector('.circus-book-type').classList.remove('hidden')
    } else {
      document.querySelector('.circus-book-type').classList.add('hidden')
    }
  })
})


sendButton.addEventListener("click", () => {
  if (finalTripName == 'رحلة السيــرك') {
      let whatsURL = `https://wa.me/+201150337383?text=
      ${bookingTitle}%0a
      الاسم : ${customerName.value}%0a
      الموبايل : ${phone.value}%0a
      العنوان : ${address.value}%0a
      المحافظة : ${governorate.value}%0a
      الرحلة : ${tripName.textContent.trim()}%0a
      تاريخ الحجز : ${date()}%0a
      عدد الأفراد (الكبار) : ${adultsCount.value}%0a
      عدد الأفراد (الصغار) : ${childrenCount.value}%0a
      نوع الحجز : ${bookTypeChecked}%0a
      حجز مقعد بالباص : ${seatChecked}%0a
      طريقة الدفع : ${paymentChecked}%0a
      رسالة / استفسار : ${msg.value}%0a
      مين بلغك بالرحلة : ${whoChecked}
      `
      window.open(whatsURL)
  } else {
      let whatsURL = `https://wa.me/+201150337383?text=
      ${bookingTitle}%0a
      الاسم : ${customerName.value}%0a
      الموبايل : ${phone.value}%0a
      العنوان : ${address.value}%0a
      المحافظة : ${governorate.value}%0a
      الرحلة : ${tripName.textContent.trim()}%0a
      تاريخ الحجز : ${date()}%0a
      عدد الأفراد (الكبار) : ${adultsCount.value}%0a
      عدد الأفراد (الصغار) : ${childrenCount.value}%0a
      حجز مقعد بالباص : ${seatChecked}%0a
      طريقة الدفع : ${paymentChecked}%0a
      رسالة / استفسار : ${msg.value}%0a
      مين بلغك بالرحلة : ${whoChecked}
      `
      window.open(whatsURL)
    }
})


cencelButton.addEventListener("click", () => {
  customerName.value = ''
  phone.value = ''
  address.value = ''
  governorate.value = ''
  day.value = ''
  month.value = ''
  year.value = currentYear
  tripName.textContent = '*حدد الرحلة'
  adultsCount.value = ''
  childrenCount.value = ''
  msg.value = ''
})