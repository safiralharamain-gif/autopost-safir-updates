
let sendBtn = document.querySelector('.send-btn')

sendBtn.addEventListener("click", () => {
  let whatsInput = document.querySelector('.whats-input').value
  let whatsURL = `https://wa.me/+201150337383?text=${whatsInput}`
  window.open(whatsURL)
  whatsInput.value = ''
})