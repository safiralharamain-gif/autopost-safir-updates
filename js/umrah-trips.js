
// all umrah trips
const umrahTripsContainer = document.querySelector('.new-umrah-trip')

const getTripsByCategory = (async () => {
  let trips = []
  await db.collection('trips').where('category', '==', 'umrah-2').get()
  .then(category => {
    category.forEach(cat => {
      let obj = cat.data()
      obj.id = `${cat.id}`
      trips.push(obj)
    })
    // Sort the trips array by 'sort' from small to large
    trips.sort((a, b) => a.sort - b.sort)
    // console.log(trips)
  })
  let renderUmrahTrips = trips.map(product => {
    // console.log(product.id)
    return /*html*/`
      <div class="col p-lg-4 py-3">
        <img src="./img/umrah-imgs/${product.imgs}" class="rounded-4 shadow" alt="" width="100%">
        <button onclick="getID('${product.id}')" class="btn-primary border-0 text-regular fs-5 mt-3 mx-auto user-select-none">
          <span>المزيــد</span>
          <img class="ms-3" src="./img/icons/arrow-link.svg" alt="arrow-link-icon" width="25px">
        </button>
      </div>
    `
  })
    umrahTripsContainer.innerHTML = renderUmrahTrips.join('')
})()