
const detailsContainer = document.querySelector('.details-container')

let tripDetails

// Get a single document
(async function getSingleDoc() {

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  await db.collection('trips').doc(`${productId}`).get()
    .then(doc => {
      if (doc.exists) {
        tripDetails = doc.data()
        // console.log(doc.id)
        // console.log(tripDetails.category)
      }
    })

  // umrah & hajj details
  if (tripDetails.category == 'umrah' || tripDetails.category == 'umrah-2') {
    detailsContainer.innerHTML = /*html*/`
      <div class="container mx-auto px-3" style="max-width: 1000px;">
        <h1 class="fs-2 text-center lh-lg mb-0" style="margin-top: 10rem;">${tripDetails.tripTitle}</h1>
  
        <div class="details-imgs w-100 mx-auto rounded-5 overflow-hidden shadow">
          <img class="w-100" src="./img/umrah-imgs/${tripDetails.imgs}" alt="">
        </div>

        ${tripDetails.description != "" && tripDetails.description != undefined ? /*html*/`
          <p class="fs-6 text-center lh-lg mt-2">${tripDetails.description}</p>
          ` : ''
        }

        <div class="program-details mx-auto mt-5" style="max-width: 900px;">
          <h3 class="fs-5 mb-3">تفاصيل البرنامج:</h3>
          <table class="table table-striped table-bordered rounded-4 overflow-hidden mb-4">
            <tbody>
              <tr>
                <td class="table-row">المستوى</td>
                <td class="table-row">${tripDetails.level}</td>
              </tr>
              <tr>
                <td class="table-row">تاريخ الرحلة</td>
                <td class="table-row">${tripDetails.tripDate}</td>
              </tr>
              <tr>
                <td class="table-row">مدة الرحلة</td>
                <td class="table-row">${tripDetails.flightDuration}</td>
              </tr>
              ${tripDetails.returnDate != "" && tripDetails.returnDate != undefined ? /*html*/`
                <tr>
                  <td class="table-row">تاريخ العودة</td>
                  <td class="table-row">${tripDetails.returnDate}</td>
                </tr>
                ` : ''
              }       
              <tr>
                <td class="table-row">مسار الرحلة</td>
                <td class="table-row">${tripDetails.itinerary}</td>
              </tr>

              <tr>
                <td class="table-row">شركة الطيران</td>
                <td class="table-row">${tripDetails.airline}</td>
              </tr>
              ${tripDetails.MakaHotel != "" && tripDetails.MakaHotel != undefined  ? /*html*/`
                <tr>
                  <td class="table-row">فندق مكة</td>
                  <td class="table-row">${tripDetails.MakaHotel}</td>
                </tr>
              ` : ''
              }
              ${tripDetails.MadinaHotel != "" && tripDetails.MadinaHotel != undefined  ? /*html*/`
                <tr>
                  <td class="table-row">فندق المدينة</td>
                  <td class="table-row">${tripDetails.MadinaHotel}</td>
                </tr>
              ` : ''
              }
              ${tripDetails.fivePrice != "" && tripDetails.fivePrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الخماسي</td>
                  <td class="table-row">${tripDetails.fivePrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.quadruplePrice != "" && tripDetails.quadruplePrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الرباعي</td>
                  <td class="table-row">${tripDetails.quadruplePrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.triplePrice != "" && tripDetails.triplePrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الثلاثي</td>
                  <td class="table-row">${tripDetails.triplePrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.binaryPrice != "" && tripDetails.binaryPrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الثنائي</td>
                  <td class="table-row">${tripDetails.binaryPrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.childPrice != "" && tripDetails.childPrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الطفل</td>
                  <td class="table-row">${tripDetails.childPrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.infantPrice != "" && tripDetails.infantPrice != undefined ? /*html*/`
                <tr>
                  <td class="table-row">سعر الرضيع</td>
                  <td class="table-row">${tripDetails.infantPrice}<span class="ms-1 text-regular">جنيه مصري</span></td>
                </tr>
              ` : ''
              }
              ${tripDetails.company.companyName != "" && tripDetails.company.companyName != undefined ? /*html*/`
                <tr>
                  <td class="table-row">شركة السياحة</td>
                  <td class="table-row">${tripDetails.company.companyName}</td>
                </tr>
              ` : ''
              }
 
            </tbody>
          </table >
        </div>

        <div class="childs mx-auto" style="max-width: 900px;">
          <p class="lh-lg mb-2">
            * الرضيع : من يوم إلى 2 سنة، والإقامة مع ذويهم بالغرفة بدون سرير إضافى.
          </p>
          <p class="lh-lg mb-0">
            * الطفل : من 2 سنة الى 12 سنة، والإقامة مع ذويهم بالغرفة بدون سرير إضافى وله مقعد في الأتوبيس.
          </p>
        </div>


        <div class="program-includes mt-5 mb-3 mx-auto px-2" style="max-width: 900px;">
          <h3 class="fs-5">البرنامج يشمل:</h3>
          <ul class="mt-3">
            ${tripDetails.programIncludes.map(pro => {
              return /*html*/`<li class="pro-item lh-lg">${pro}</li>`
              }).join('')
            }
          </ul>
        </div>

        ${tripDetails.tripNotIncludes != '' && tripDetails.tripNotIncludes != undefined ? /*html*/`
          <div class="trip-notes mt-5 mb-3 mx-auto px-2" style="max-width: 900px;">
            <h3 class="fs-5">البرنامج لا يشمل:</h3>
            <p class="lh-lg mb-0">${tripDetails.tripNotIncludes}</p>
          </div>
        ` : ''
        }

        ${tripDetails.notes != '' ? /*html*/`
          <div class="trip-notes mt-5 mb-3 mx-auto px-2" style="max-width: 900px;">
            <h3 class="fs-5">ملاحظات:</h3>
            <ul class="mt-3">
              ${tripDetails.notes.map(note => {
                return /*html*/`<li class="pro-item lh-lg">${note}</li>`
                }).join('')
              }
            </ul>
          </div>
        ` : ''
        }

        <div class="required-doc mt-5 mb-5 mx-auto px-2" style="max-width: 900px;">
          <h3 class="fs-5">الأوراق والمستندات المطلوبة:</h3>
          <ul class="mt-3">
            <li class="pro-item lh-lg">جواز سفر صالح لمدة لا تقل عن 6 شهور على الأقل.</li>
            <li class="pro-item lh-lg">شهادة صحية خاصة بالحج والعمرة.</li>
            <li class="pro-item lh-lg">عدد ( 2 ) صور شخصية حديثة خلفية بيضاء.</li>
            <li class="pro-item lh-lg">استخراج تصريح سفر لمن هم في سن التجنيد.</li>
          </ul>
          <p class="mt-5">*تطبق الشروط والأحكام.</p>
          <p class="text-bold text-secondary lh-lg mt-3">للمزيد من التفاصيل يرجى التواصل معنا لنتمكن من خدمتكم بشكل أفضل.</p>
        </div>
      </div> <!-- end container -->
        
      <section class="section bg-secondary">
        <div class="container">
          <div class="booking-form bg-white rounded-5 shadow p-5 mx-auto" style="max-width: 900px;">
            <h3 class="booking-title fs-1 text-center text-secondary mx-auto mt-2 mb-5">حجـز رحلـة عمـرة</h3>
            <form class="text-regular" action="">
  
              <div class="row mb-3">
                <div class="col">
                  <label class="text-gray mb-1 mb-1" for="name">الاسم</label>
                  <input type="text" name="name" id="name" class="form-control form-control-lg rounded-4">
                </div>
                <div class="col">
                  <label class="text-gray mb-1" for="phone">الموبايل</label>
                  <input type="text" name="phone" id="phone" class="form-control form-control-lg rounded-4">
                </div>
              </div>
  
              <div class="row mb-3">
                <div class="col">
                  <label class="text-gray mb-1 mb-1" for="address">العنوان</label>
                  <input type="text" name="address" id="address" class="form-control form-control-lg rounded-4">
                </div>
                <div class="col">
                  <label class="text-gray mb-1" for="governorate">المحافظة</label>
                  <input type="text" name="governorate" id="governorate" class="form-control form-control-lg rounded-4">
                </div>
              </div>
  
              <div class="row mb-3">
                <div class="col">
                  <label class="text-gray mb-1" for="trip-name">الرحلـة</label>
                  <input type="text" name="trip-name" id="trip-name" class="form-control form-control-lg rounded-4">

                  <!-- <div class="dropdown">
                    <button class="select text-start btn bg-white border rounded-4 w-100 dropdown-toggle" name="trip-name"
                      id="trip-name" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      *حدد الرحلة
                    </button>
                    <ul class="dropdown-menu rounded-4">
                      <li class="dropdown-item">عمرة ترانزيت</li>
                      <li class="dropdown-item">عرض خاص</li>
                      <li class="dropdown-item">رحلة عمرة المولد النبوي</li>
                      <li class="dropdown-item">رحلة عمرة اقتصادي</li>
                      <li class="dropdown-item">رحلة عمرة 3 نجــوم</li>
                      <li class="dropdown-item">رحلة عمرة 4 نجــوم</li>
                      <li class="dropdown-item">رحلة عمرة 5 نجــوم</li>
                      <li class="dropdown-item">رحلة عمرة رجــب</li>
                      <li class="dropdown-item">رحلة عمرة شعبـان</li>
                      <li class="dropdown-item">رحلة عمرة شعبـان رمضـان</li>
                      <li class="dropdown-item">رحلة عمرة رمضــان</li>
                    </ul>
                  </div> -->
                </div>
                <div class="col">
                  <label class="text-gray mb-1 mb-1">تاريخ الرحلـة</label>
                  <div class="form-control form-control-lg rounded-4 ps-2 pb-0"
                    style="min-height: 46px; padding-top: .35rem ;">
                    <input type="text" class="day p-0 pt-2 border-0 text-center" placeholder="يوم" style="width: 35px;">
                    <span class="d-inline-block text-gray fs-6 mt-1 user-select-none">/</span>
                    <input type="text" class="month p-0 pt-2 border-0 text-center" placeholder="شهر" style="width: 35px;">
                    <span class="d-inline-block text-gray fs-6 mt-1 user-select-none">/</span>
                    <input type="text" class="year p-0 pt-2 border-0 text-center" style="width: 55px;">
                  </div>
                </div>
              </div>
  
              <div class="row mb-4">
                <div class="col">
                  <label class="text-gray mb-1" for="adults-count">عدد الأفراد (الكبار)</label>
                  <input type="text" name="adults-count" id="adults-count" class="form-control form-control-lg rounded-4">
                </div>
                <div class="col">
                  <label class="text-gray mb-1" for="children-count">عدد الأفراد (الصغار)</label>
                  <input type="text" name="children-count" id="children-count"
                    class="form-control form-control-lg rounded-4">
                </div>
              </div>
  
              <div class="row mb-4">
                <span class="text-gray mb-3">نوع الغرفة</span>
                <div class="d-flex">
                  <div class="form-check m-left">
                    <input class="form-check-input" type="radio" name="room-type" id="four" checked>
                    <label class="form-check-label mt-2px" for="four">
                      رباعـي
                    </label>
                  </div>
                  <div class="form-check m-left">
                    <input class="form-check-input" type="radio" name="room-type" id="three">
                    <label class="form-check-label mt-2px" for="three">
                      ثلاثـي
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="room-type" id="two">
                    <label class="form-check-label" for="two">
                      ثنائــي
                    </label>
                  </div>
                </div>
              </div>
  
              <div class="row mb-4">
                <span class="text-gray mb-3">الوجبــات</span>
                <div class="d-flex">
                  <div class="form-check m-left">
                    <input class="form-check-input" type="radio" name="meals" id="meals-yes">
                    <label class="form-check-label mt-2px" for="meals-yes">
                      نعم
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="meals" id="meals-no" checked>
                    <label class="form-check-label mt-2px" for="meals-no">
                      لا
                    </label>
                  </div>
                </div>
              </div>
  
              <div class="row mb-4">
                <span class="text-gray mb-3">طريقة الدفع</span>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-auto ps-4">
                  <div class="col form-check me-lg-5 mb-3">
                    <input class="form-check-input" type="radio" name="payment-method" id="payment-cash" checked>
                    <label class="form-check-label mt-2px" for="payment-cash">
                      كاش
                    </label>
                  </div>
                  <div class="col form-check me-lg-5 mb-3">
                    <input class="form-check-input" type="radio" name="payment-method" id="payment-wallet-cash">
                    <label class="form-check-label mt-2px max-content" for="payment-wallet-cash">
                      محفظة كاش
                    </label>
                  </div>
                  <div class="col form-check me-lg-5 mb-3">
                    <input class="form-check-input" type="radio" name="payment-method" id="payment-bank">
                    <label class="form-check-label mt-2px max-content" for="payment-bank">
                      تحويل بنكى
                    </label>
                  </div>
                  <div class="col form-check mb-3">
                    <input class="form-check-input" type="radio" name="payment-method" id="payment-visa">
                    <label class="form-check-label mt-2px" for="payment-visa">
                      فيزا
                    </label>
                  </div>
                </div>
              </div>
  
              <div class="row mb-4" style="margin-top: -1rem;">
                <label class="form-label text-gray" for="msg">رسالــة / استفســار</label>
                <textarea class="form-control rounded-4" id="msg" rows="5" style="padding: 1rem;"></textarea>
              </div>
  
              <div class="row">
                <span class="text-gray mb-3">مين بلغك بالرحلة ؟</span>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 ps-4">
                  <div class="col form-check mb-3">
                    <input class="form-check-input" type="radio" name="who-told-you" id="friend" checked>
                    <label class="form-check-label mt-2px" for="friend">
                      صديق رشحنا ليك
                    </label>
                  </div>
                  <div class="col form-check mb-3">
                    <input class="form-check-input" type="radio" name="who-told-you" id="by-facebook">
                    <label class="form-check-label mt-2px" for="by-facebook">
                      عن طريق الفيسبوك
                    </label>
                  </div>
                  <div class="col form-check mb-3">
                    <input class="form-check-input" type="radio" name="who-told-you" id="by-whats">
                    <label class="form-check-label mt-2px max-content" for="by-whats">
                      عن طريق الواتساب
                    </label>
                  </div>
                  <div class="col form-check mb-3">
                    <input class="form-check-input" type="radio" name="who-told-you" id="by-web">
                    <label class="form-check-label mt-2px max-content" for="by-web">
                      عن طريق الموقع
                    </label>
                  </div>
                  <div class="col form-check">
                    <input class="form-check-input" type="radio" name="who-told-you" id="former-client">
                    <label class="form-check-label mt-2px max-content" for="former-client">
                      عميل سابق
                    </label>
                  </div>
                </div>
              </div>
  
              <div class="mt-5">
                <button type="button" class="send btn btn-secondary btn-lg rounded-4 px-5 d-inline-flex align-items-center"
                  style="padding-top: .75rem; width: 200px;">
                  <span class="mx-2">إرسال</span>
                  <img src="./img/icons/send.svg" width="25px" alt="send-icon" style="margin-top: -4px;">
                </button>
                <button type="button" class="cencel btn btn-light btn-lg transition rounded-4 px-5 ms-3"
                  style="padding-top: .75rem; width: 200px;">
                  إلغاء
                </button>
              </div>
            </form>
        </div>
      </section>
    `
    let bookFile = document.createElement('script');
    bookFile.src = './js/umrah-booking.js';
    document.head.appendChild(bookFile);
  }

  // inside trip details
  if (tripDetails.category == 'insideTrip') {
    console.log(tripDetails.imgs.length)
    detailsContainer.innerHTML = /*html*/`
    <div class="container mx-auto px-3" style = "max-width: 1000px;">

      <h1 class="fs-2 text-center mb-2" style="margin-top: 10rem;">${tripDetails.tripTitle}</h1>
      ${tripDetails.imgs.length > 1 ? /*html*/`
          <!-- start swiper -->
          <div class="details-carousel swiper">
            <div class="slider-wrapper">
              <div class="swiper-wrapper">
                <!-- Slides Items -->
                ${tripDetails.imgs.map(img => {
                  return /*html*/`
                    <div class="swiper-slide mb-3">
                      <div class="details-imgs rounded-5 overflow-hidden" style="max-height: 500px;">
                        <img class="w-100" src="./img/inside-trip-imgs/${img}" alt="">
                      </div>
                    </div>
                  `
                  }).join('')
                }
              </div>
  
              <!-- pagination -->
              <div class="swiper-pagination" style="bottom: 0px"></div>
  
              <!-- navigation buttons -->
              <div class="swiper-button-prev text-gray"></div>
              <div class="swiper-button-next text-gray"></div>
  
            </div>
  
          </div>
          <!-- end swiper -->

        ` : /*html*/`
          <div class="details-imgs rounded-5 overflow-hidden" style="max-height: 500px;">
            <img class="w-100" src="./img/inside-trip-imgs/${tripDetails.imgs}" alt="">
          </div>
        `
      }

      <p class="fs-6 text-center lh-lg mt-4">${tripDetails.description}</p>
  
          <div class="program-details mx-auto mt-5" style="max-width: 900px;">
            <h3 class="fs-5 mb-3">التفاصيل:</h3>
            <table class="table table-striped table-bordered rounded-4 overflow-hidden mb-4">
              <tbody>
                <tr>
                  <td class="table-row">اسم الرحلة</td>
                  <td class="table-row">${tripDetails.tripTitle}</td>
                </tr>

                ${tripDetails.flightDuration != "" ? /*html*/`
                  <tr>
                    <td class="table-row">مدة الرحلة</td>
                    <td class="table-row">${tripDetails.flightDuration}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.tripDate != "" ? /*html*/`
                  <tr>
                    <td class="table-row">تاريخ الرحلة</td>
                    <td class="table-row">${tripDetails.tripDate}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.returnDate != "" ? /*html*/`
                  <tr>
                    <td class="table-row">تاريخ العودة</td>
                    <td class="table-row">${tripDetails.returnDate}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.itinerary != "" ? /*html*/`
                  <tr>
                    <td class="table-row">مسار الرحلة</td>
                    <td class="table-row">${tripDetails.itinerary}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.tripTransfer != "" ? /*html*/`
                  <tr>
                    <td class="table-row">وسيلة النقل</td>
                    <td class="table-row">${tripDetails.tripTransfer}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.tripPrice != "" ? /*html*/`
                  <tr>
                    <td class="table-row">سعر الرحلة</td>
                    <td class="table-row">${tripDetails.tripPrice}</td>
                    <!-- <span class="ms-1 text-regular">جنيه</span> -->
                  </tr>
                  ` : ''
                }
                ${tripDetails.childPrice != "" ? /*html*/`
                  <tr>
                    <td class="table-row">سعر الطفل</td>
                    <td class="table-row">${tripDetails.childPrice}</td>
                  </tr>
                  ` : ''
                }
                ${tripDetails.company.companyName != "" ? /*html*/`
                  <tr>
                    <td class="table-row">شركة السياحة</td>
                    <td class="table-row">${tripDetails.company.companyName}</td>
                  </tr>
                  ` : ''
                }
              </tbody>
            </table>
          </div>
  
          <div class="program-includes mt-5 mb-3 mx-auto px-2" style="max-width: 900px;">
            <h3 class="fs-5">المميزات:</h3>
            <ul class="mt-3">
              ${tripDetails.tripFeatures.map(pro => {
                return /*html*/`<li class="pro-item lh-lg">${pro}</li>`
                }).join('')
              }
            </ul>
          </div>
  
          ${tripDetails.tripIncludes.length != 0 ? /*html*/`
            <div class="program-includes mt-5 mb-3 mx-auto px-2" style="max-width: 900px;">
              <h3 class="fs-5">الرحلة تشمل:</h3>
              <ul class="mt-3">
                ${tripDetails.tripIncludes.map(pro => {
                  return /*html*/`<li class="pro-item lh-lg">${pro}</li>`
                  }).join('')
                }
              </ul>
            </div>
          ` : ''
          }

        <div class="trip-notes mt-5 mb-5 mx-auto px-2" style="max-width: 900px;">
          ${tripDetails.notes.length != 0 ? /*html*/`
            <h3 class="fs-5">ملاحظات:</h3>
            <ul class="mt-3">
              ${tripDetails.notes.map(note => {
                return /*html*/`<li class="pro-item lh-lg">${note}</li>`
                }).join('')
              }
            </ul>
          ` : ''
          }
      
          <p class="text-bold text-secondary lh-lg my-4">للمزيد من التفاصيل يرجى التواصل معنا لنتمكن من خدمتكم بشكل أفضل.</p>
        </div>
      </div>
    </div> <!-- end container -->
    
    <section class="section bg-secondary">
      <div class="container">
        <div class="booking-form bg-white rounded-5 shadow p-5 mx-auto" style="max-width: 900px;">
          <h3 class="booking-title fs-1 text-center text-secondary mx-auto mt-2 mb-5">حجــز رحلـــة</h3>
          <form class="text-regular" action="">

            <div class="row mb-3">
              <div class="col">
                <label class="text-gray mb-1 mb-1" for="name">الاسم</label>
                <input type="text" name="name" id="name" class="form-control form-control-lg rounded-4">
              </div>
              <div class="col">
                <label class="text-gray mb-1" for="phone">الموبايل</label>
                <input type="text" name="phone" id="phone" class="form-control form-control-lg rounded-4">
              </div>
            </div>

            <div class="row mb-3">
              <div class="col">
                <label class="text-gray mb-1 mb-1" for="address">العنوان</label>
                <input type="text" name="address" id="address" class="form-control form-control-lg rounded-4">
              </div>
              <div class="col">
                <label class="text-gray mb-1" for="governorate">المحافظة</label>
                <input type="text" name="governorate" id="governorate" class="form-control form-control-lg rounded-4">
              </div>
            </div>

            <div class="row mb-3">
              <div class="col">
                <label class="text-gray mb-1" for="trip-name">الرحلـة</label>
                <div class="dropdown">
                  <button class="select text-start btn bg-white border rounded-4 w-100 dropdown-toggle" name="trip-name"
                    id="trip-name" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    *حدد الرحلة
                  </button>
                  <ul class="dropdown-menu rounded-4">
                  <li class="dropdown-item">رحلة القاهــرة</li>
                  <li class="dropdown-item">رحلة الفيـــوم</li>
                  <li class="dropdown-item">رحلة بورسعــيد</li>
                  <li class="dropdown-item">رحلة سيــــوه</li>
                  <li class="dropdown-item">رحلة أفريكانو بارك</li>
                  <li class="dropdown-item">رحلة أليكس ووتر مارك</li>
                  <li class="dropdown-item">رحلة خان خديجــة</li>
                  <li class="dropdown-item">رحلة اليخــت</li>
                  <li class="dropdown-item">قرية لمــار</li>
                  <li class="dropdown-item">رحلة السيــرك</li>
                  <li class="dropdown-item">رحلة برج جوري ( مرسى مطروح )</li>
                  <li class="dropdown-item">رحلة موز بالاس ( مرسى مطروح )</li>
                  <li class="dropdown-item">رحلة لاس فيجاس ( مرسى مطروح )</li>
                  <li class="dropdown-item">رحلة مرسى مطروح ( اليوم الواحد )</li>
                  </ul>
                </div>
              </div>
              <div class="col">
                <label class="text-gray mb-1 mb-1">تاريخ السفر</label>
                <div class="form-control form-control-lg rounded-4 ps-2 pb-0"
                  style="min-height: 46px; padding-top: .35rem ;">
                  <input type="text" class="day p-0 pt-2 border-0 text-center" placeholder="يوم" style="width: 35px;">
                  <span class="d-inline-block text-gray fs-6 mt-1 user-select-none">/</span>
                  <input type="text" class="month p-0 pt-2 border-0 text-center" placeholder="شهر" style="width: 35px;">
                  <span class="d-inline-block text-gray fs-6 mt-1 user-select-none">/</span>
                  <input type="text" class="year p-0 pt-2 border-0 text-center" style="width: 55px;">
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <div class="col">
                <label class="text-gray mb-1" for="adults-count">عدد الأفراد (الكبار)</label>
                <input type="text" name="adults-count" id="adults-count" class="form-control form-control-lg rounded-4">
              </div>
              <div class="col">
                <label class="text-gray mb-1" for="children-count">عدد الأفراد (الصغار)</label>
                <input type="text" name="children-count" id="children-count"
                  class="form-control form-control-lg rounded-4">
              </div>
            </div>

            <div class="row mb-4 circus-book-type hidden">
              <span class="text-gray mb-3">نوع الحجز</span>
              <div class="d-flex">
                <div class="form-check m-left">
                  <input class="form-check-input" type="radio" name="book-type" id="normal" checked>
                  <label class="form-check-label mt-2px" for="normal">
                    عادى
                  </label>
                </div>
                <div class="form-check m-left">
                  <input class="form-check-input" type="radio" name="book-type" id="middle">
                  <label class="form-check-label mt-2px" for="middle">
                    متوسط
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="book-type" id="vib">
                  <label class="form-check-label" for="vib" style="font-family: arial;">
                    VIB
                  </label>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <span class="text-gray mb-3">حجز مقعد بالباص</span>
              <div class="d-flex">
                <div class="form-check m-left">
                  <input class="form-check-input" type="radio" name="book-seat" id="seat-yes" checked>
                  <label class="form-check-label mt-2px" for="seat-yes">
                    نعم
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="book-seat" id="seat-no">
                  <label class="form-check-label mt-2px" for="seat-no">
                    لا
                  </label>
                </div>
              </div>
            </div>

            <div class="row mb-4">
              <span class="text-gray mb-3">طريقة الدفع</span>
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-auto ps-4">
                <div class="col form-check me-lg-5 mb-3">
                  <input class="form-check-input" type="radio" name="payment-method" id="payment-cash" checked>
                  <label class="form-check-label mt-2px" for="payment-cash">
                    كاش
                  </label>
                </div>
                <div class="col form-check me-lg-5 mb-3">
                  <input class="form-check-input" type="radio" name="payment-method" id="payment-wallet-cash">
                  <label class="form-check-label mt-2px max-content" for="payment-wallet-cash">
                    محفظة كاش
                  </label>
                </div>
                <div class="col form-check me-lg-5 mb-3">
                  <input class="form-check-input" type="radio" name="payment-method" id="payment-bank">
                  <label class="form-check-label mt-2px max-content" for="payment-bank">
                    تحويل بنكى
                  </label>
                </div>
                <div class="col form-check mb-3">
                  <input class="form-check-input" type="radio" name="payment-method" id="payment-visa">
                  <label class="form-check-label mt-2px" for="payment-visa">
                    فيزا
                  </label>
                </div>
              </div>
            </div>

            <div class="row mb-4" style="margin-top: -1rem;">
              <label class="form-label text-gray" for="msg">رسالــة / استفســار</label>
              <textarea class="form-control rounded-4" id="msg" rows="5" style="padding: 1rem;"></textarea>
            </div>

            <div class="row">
              <span class="text-gray mb-3">مين بلغك بالرحلة ؟</span>
              <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 ps-4">
                <div class="col form-check mb-3">
                  <input class="form-check-input" type="radio" name="who-told-you" id="friend" checked>
                  <label class="form-check-label mt-2px" for="friend">
                    صديق رشحنا ليك
                  </label>
                </div>
                <div class="col form-check mb-3">
                  <input class="form-check-input" type="radio" name="who-told-you" id="by-facebook">
                  <label class="form-check-label mt-2px" for="by-facebook">
                    عن طريق الفيسبوك
                  </label>
                </div>
                <div class="col form-check mb-3">
                  <input class="form-check-input" type="radio" name="who-told-you" id="by-whats">
                  <label class="form-check-label mt-2px max-content" for="by-whats">
                    عن طريق الواتساب
                  </label>
                </div>
                <div class="col form-check mb-3">
                  <input class="form-check-input" type="radio" name="who-told-you" id="by-web">
                  <label class="form-check-label mt-2px max-content" for="by-web">
                    عن طريق الموقع
                  </label>
                </div>
                <div class="col form-check">
                  <input class="form-check-input" type="radio" name="who-told-you" id="former-client">
                  <label class="form-check-label mt-2px max-content" for="former-client">
                    عميل سابق
                  </label>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <button type="button" class="send btn btn-secondary btn-lg rounded-4 px-5 d-inline-flex align-items-center"
                style="padding-top: .75rem; width: 200px;">
                <span class="mx-2">إرسال</span>
                <img src="./img/icons/send.svg" width="25px" alt="send-icon" style="margin-top: -4px;">
              </button>
              <button type="button" class="cencel btn btn-light btn-lg transition rounded-4 px-5 ms-3"
                style="padding-top: .75rem; width: 200px;">
                إلغاء
              </button>
            </div>

          </form>
        </div>
      </div>
    </section>
    `
    let bookFile = document.createElement('script');
    bookFile.src = './js/travel-booking.js';
    document.head.appendChild(bookFile);

  }

})();