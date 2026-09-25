
let sendButton      = document.querySelector('.send')
let cencelButton    = document.querySelector('.cencel')

let bookingTitle    = document.querySelector(".booking-title").textContent
let customerName    = document.getElementById("name")
let phone           = document.getElementById("phone")
let address         = document.getElementById("address")
let governorate     = document.getElementById("governorate")
let destination     = document.getElementById("destination")
let serviceType     = document.querySelector(".booking-form .service-type")

// departure type
let departureType = document.getElementsByName("departure-type")
let checked       = document.getElementById("one-way").nextElementSibling.textContent.trim()

function checkRadio(nameAttr, updateCallback) {
  nameAttr.forEach(selected => {
    selected.addEventListener('change', (e) => {
      nameAttr.forEach( uncheck => { 
        uncheck.removeAttribute('checked')
      })
      e.target.setAttribute('checked', '')
      updateCallback(e.target.nextElementSibling.textContent.trim())
      tripDate()
    })
  })
}

checkRadio(departureType, (newValue) => { checked = newValue })

let defaultChecked  = document.getElementById("one-way")
let going           = document.querySelector('.going')
let goingAndReturn  = document.querySelector('.going-return')

function tripDate() {
  if (defaultChecked.hasAttribute('checked')) {
    going.classList.remove('hidden')
    goingAndReturn.classList.add('hidden')
  } else {
    going.classList.add('hidden')
    goingAndReturn.classList.remove('hidden')
  }
}

// going only date
let goingOnly_Day   = document.querySelector(".going-only-day")
let goingOnly_Month = document.querySelector(".going-only-month")
let goingOnly_Year  = document.querySelector(".going-only-year")

// going and return date
let going_Day   = document.querySelector(".going-day")
let going_Month = document.querySelector(".going-month")
let going_Year  = document.querySelector(".going-year")

let return_Day   = document.querySelector(".return-day")
let return_Month = document.querySelector(".return-month")
let return_Year  = document.querySelector(".return-year")

let currentYear  = new Date().getFullYear()

goingOnly_Year.value = currentYear || goingOnly_Year.value
going_Year.value     = currentYear || going_Year.value
return_Year.value    = currentYear || return_Year.value

function date(day, month, year) {
  let fullDate = day.value + ' / ' + month.value + ' / ' + year.value
  return fullDate
}

sendButton.addEventListener("click", () => {
    if (checked == 'ذهاب فقط') {
    let whatsURL = `https://wa.me/+201150337383?text=
    ${bookingTitle}%0a
    الاسم : ${customerName.value}%0a
    الموبايل : ${phone.value}%0a
    العنوان : ${address.value}%0a
    المحافظة : ${governorate.value}%0a
    الوجهة : ${destination.value}%0a
    نوع الخدمة : ${serviceType.textContent.trim()}%0a
    ${checked}%0a
    تاريخ الذهاب : ${date(goingOnly_Day, goingOnly_Month, goingOnly_Year)}
    `
    window.open(whatsURL)
  } else {
    let whatsURL = `https://wa.me/+201150337383?text=
    ${bookingTitle}%0a
    الاسم : ${customerName.value}%0a
    الموبايل : ${phone.value}%0a
    العنوان : ${address.value}%0a
    المحافظة : ${governorate.value}%0a
    الوجهة : ${destination.value}%0a
    نوع الخدمة : ${serviceType.textContent.trim()}%0a
    ${checked}%0a
    تاريخ الذهاب : ${date(going_Day, going_Month, going_Year)}%0a
    تاريخ العودة : ${date(return_Day, return_Month, return_Year)}
    `
    window.open(whatsURL)
  }
})

cencelButton.addEventListener("click", () => {
  customerName.value = ''
  phone.value = ''
  address.value = ''
  governorate.value = ''
  destination.value = ''
  serviceType.textContent = '*حدد نوع الخدمة'
  goingOnly_Day.value = ''
  goingOnly_Month.value = ''
  goingOnly_Year.value = currentYear
  going_Day.value = ''
  going_Month.value = ''
  going_Year.value = currentYear
  return_Day.value = ''
  return_Month.value = ''
  return_Year.value = currentYear
})