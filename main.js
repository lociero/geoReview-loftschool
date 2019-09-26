new Promise(resolve => ymaps.ready(resolve))
  .then(() => init())
  .catch(e => console.log(`Ошибка: ${e.message}`));

const myBalloon = document.querySelector("#window_balloon");
const closeButton = document.querySelector("#button__close");
const addButton = document.querySelector("#button__add");
const address = document.querySelector("#address");
const inputName = document.querySelector("#input__name");
const inputPlace = document.querySelector("#input__place");
const comments = document.querySelector("#comments");
const inputText = document.querySelector("#input__text");
const placemarks = []; // для использования внутри внешней функции openBalloonFull().

function init() {
  let myPlacemark;
  let coordinates;
  const myMap = new ymaps.Map(
    "map",
    {
      center: [58.01, 56.23], // Perm =)
      zoom: 12
    },
    {
      searchControlProvider: "yandex#search"
    }
  );
  // Создание кластера.
  const clusterer = new ymaps.Clusterer({
    preset: "islands#invertedNightClusterIcons",
    groupByCoordinates: false,
    clusterDisableClickZoom: true,
    clusterHideIconOnBalloonOpen: false,
    geoObjectHideIconOnBalloonOpen: false,
    clusterOpenBalloonOnClick: true,
    clusterBalloonContentLayout: "cluster#balloonCarousel",
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 250,
    clusterBalloonPagerSize: 10,
    clusterBalloonPagerType: "marker"
  });

  clusterer.add(placemarks);
  myMap.geoObjects.add(clusterer);

  // Слушаем клик на карте.
  myMap.events.add("click", e => {
    const coords = e.get("coords");
    coordinates = coords;
    comments.innerHTML = "Отзывов пока нет...";

    // Выводим окно с отзывами и формой.
    openBalloon();
    myPlacemark = createPlacemark(coords);
    getAddress(coords);
  });

  // Создание метки.
  function createPlacemark(coords) {
    return new ymaps.Placemark(coords);
  }

  // Определяем адрес по координатам (обратное геокодирование).
  function getAddress(coords) {
    ymaps.geocode(coords).then(function(res) {
      const firstGeoObject = res.geoObjects.get(0);

      myPlacemark.properties.set({
        // Формируем строку с данными об объекте.
        iconCaption: [
          // Название населенного пункта или вышестоящее административно-территориальное образование.
          firstGeoObject.getLocalities().length
            ? firstGeoObject.getLocalities()
            : firstGeoObject.getAdministrativeAreas(),
          // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
          firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
        ],
        // В качестве контента балуна задаем строку с адресом объекта.
        balloonContent: firstGeoObject.getAddressLine()
      });
      // Записываем адресс обьекта в хедер окна.
      address.innerText = firstGeoObject.getAddressLine();
    });
  }

  addButton.addEventListener("click", () => {
    if (inputName.value && inputPlace.value && inputText.value) {
      // Получаем адрес отзыва.
      const addressLink = address.innerText;

      // Формируем дату.
      const date = new Date();
      let year = date.getFullYear();
      let month = `${date.getMonth() + 1}`;
      let day = `${date.getDate()}`;
      let hours = `${date.getHours()}`;
      let minutes = `${date.getMinutes()}`;
      let seconds = `${date.getSeconds()}`;

      if (day.length === 1) day = `0${day}`;
      if (month.length === 1) month = `0${month}`;
      if (hours.length === 1) hours = `0${hours}`;
      if (minutes.length === 1) minutes = `0${minutes}`;
      if (seconds.length === 1) seconds = `0${seconds}`;

      const currentTime = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`; // perfect =)

      // Создаём метку.
      const newPlacemark = new ymaps.Placemark(
        coordinates,
        {
          balloonContentHeader: inputPlace.value,
          balloonContentBody: `<a onclick="openBalloonFull()" class="balloon__address_link">${addressLink}</a><br><br>${inputText.value}<br><br>`,
          balloonContentFooter: currentTime
        },
        {
          preset: "islands#nightDotIcon",
          draggable: false,
          openBalloonOnClick: false // Используем custom balloon.
        }
      );

      // Добавляем метку на карту, в кластер и массив placemarks.
      myMap.geoObjects.add(newPlacemark);
      clusterer.add(newPlacemark);
      placemarks.push(newPlacemark);

      // Обновляем содержимое нашего балуна
      if (comments.innerHTML === "Отзывов пока нет...") comments.innerHTML = "";
      newPlacemark.commentContent = `<div><span><b>${inputName.value}</b></span>
        <span class="ligth">${inputPlace.value}</span>
        <span class="ligth">${currentTime}:</span><br>
        <span>${inputText.value}</span></div><br>`;
      comments.innerHTML += newPlacemark.commentContent;
      newPlacemark.place = address.innerText;

      // Очищаем инпуты.
      clearInputs();

      newPlacemark.events.add("click", () => {
        openBalloon();
        comments.innerHTML = newPlacemark.commentContent;
        address.innerText = newPlacemark.place;
      });
    } else {
      alert("Остались пустые поля.");
    }
  });
}

closeButton.addEventListener("click", () => {
  myBalloon.style.display = "none";
  clearInputs();
});

const clearInputs = () => {
  inputName.value = "";
  inputPlace.value = "";
  inputText.value = "";
};

// Наш кастомный балун.
const openBalloon = () => {
  myBalloon.style.top = event.clientY + "px";
  myBalloon.style.left = event.clientX + "px";
  myBalloon.style.display = "block";
};

// Балун с контентом из placemarks.
const openBalloonFull = () => {
  address.innerText = "";
  comments.innerHTML = "";
  const addressLink = document.querySelector(".balloon__address_link");

  for (let i = 0; i < placemarks.length; i++) {
    if (addressLink.innerText === placemarks[i].place) {
      address.innerText = placemarks[i].place;
      comments.innerHTML += placemarks[i].commentContent;
    }
  }

  myBalloon.style.top = event.clientY + "px";
  myBalloon.style.left = event.clientX + "px";
  myBalloon.style.display = "block";
};