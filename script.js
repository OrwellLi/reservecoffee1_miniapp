// script.js — минимальный и рабочий
let map;

function initMap(lat = 55.7558, lon = 37.6176) {
  if (!window.ymaps) return setTimeout(() => initMap(lat, lon), 500);

  ymaps.ready(() => {
    map = new ymaps.Map("map", { center: [lat, lon], zoom: 15 });
    new ymaps.Placemark([lat, lon], { iconCaption: "Вы здесь" }, { preset: "islands#blueCircleDotIcon" });

    if (Telegram?.WebApp) {
      Telegram.WebApp.MainButton.setText("Обновить местоположение")
        .show()
        .onClick(() => Telegram.WebApp.requestLocation().then(p => initMap(p.latitude, p.longitude)));
    }
  });
}

// Автозапуск
document.addEventListener("DOMContentLoaded", () => {
  if (Telegram?.WebApp) {
    Telegram.WebApp.requestLocation()
      .then(pos => initMap(pos.latitude, pos.longitude))
      .catch(() => initMap());
  } else {
    initMap();
  }
});