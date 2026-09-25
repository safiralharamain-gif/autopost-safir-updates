
const pathName = window.location.pathname
const pageName = pathName.split('/').pop()

if (pageName === 'index.html')
  document.querySelector('.home').classList.add('active')
  
else if (pageName === 'who-are-we.html')
  document.querySelector('.who-are-we').classList.add('active')
  
else if (pageName === 'umrah-trips.html')
  document.querySelector('.umrah-trips').classList.add('active')
  
else if (pageName === 'hajj-trips.html')
  document.querySelector('.hajj-trips').classList.add('active')
  
else if (pageName === 'travel-trips.html')
  document.querySelector('.travel-trips').classList.add('active')
  
else if (pageName === 'hotel-booking.html')
  document.querySelector('.hotel-booking').classList.add('active')
  
else if (pageName === 'flight-booking.html')
  document.querySelector('.flight-booking').classList.add('active')
  
else if (pageName === 'visa.html')
  document.querySelector('.visa').classList.add('active')
  
else if (pageName === 'barcode.html')
  document.querySelector('.barcode').classList.add('active')
  
else if (pageName === 'transport.html')
  document.querySelector('.transport').classList.add('active')
  
else if (pageName === 'news.html')
  document.querySelector('.news').classList.add('active')
  
else if (pageName === 'gallery.html')
  document.querySelector('.gallery').classList.add('active')
  
else if (pageName === 'questions.html')
  document.querySelector('.questions').classList.add('active')