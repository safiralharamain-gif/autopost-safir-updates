

let shareBtn = document.querySelector('.call-us .share-icon')
let socialMedia = document.querySelector('.call-us .share-icon .social-media')

shareBtn.addEventListener("click", () => {
  shareBtn.classList.toggle("close-icon")
  socialMedia.classList.toggle("hidden")
  if (!callsCompany.classList.contains('hidden')) {
    callsCompany.classList.add('hidden')
    callBtn.classList.remove("close-icon")
  }
})

let pageURL = encodeURIComponent(window.location.href)

function shareOnFacebook() {
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + pageURL, '_blank')
}

function shareOnTwitter() {
  window.open('https://x.com/intent/post?url=' + pageURL, '_blank');
}

function shareOnWhatsApp() {
  window.open('https://api.whatsapp.com/send?text=' + pageURL, '_blank');
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  // console.log('تم النسخ')
}