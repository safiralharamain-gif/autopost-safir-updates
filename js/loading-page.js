
let loading = document.querySelector('.loading-overlay')

window.onload = () => {
  faedOut(loading)
}

// faedOut function

function faedOut(element) {
  let elementattr = Number(getComputedStyle(element).opacity);

  if (elementattr <= 0) {
    return;
  }
  element.style.opacity = elementattr - 0.01;
  setTimeout(function () {
    faedOut(element);
  }, 20);

  setTimeout(function () {
    element.remove()
  }, 2000);
}