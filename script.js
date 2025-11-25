// Ключ будет подставлен Vercel автоматически при npm run build
const YANDEX_API_KEY = "YOUR_KEY_WILL_BE_HERE";

document.addEventListener("DOMContentLoaded", () => {
  if (YANDEX_API_KEY === "YOUR_KEY_WILL_BE_HERE") {
    document.body.innerHTML = "<h1 style='color:red;text-align:center;padding:50px;'>ОШИБКА: ключ Яндекс.Карт не подставлен в Vercel</h1>";
    return;
  }

  const script = document.createElement("script");
  script.src = `https://api-maps.yandex.ru/v3/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
  script.async = true;
  script.onload = () => ymaps.ready(init);
  document.head.appendChild(script);
});

let nearbyMap, searchMap;
const favorites = JSON.parse(localStorage.getItem("fav") || "[]");

function init() {
  initTabs();
  initNearby();
  initSearch();
  renderFavorites();
}

// вкладки
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(b =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn,.tab-content").forEach(el => el.classList.remove("active"));
      b.classList.add("active");
      document.getElementById(b.dataset.tab).classList.add("active");
    })
  );
}

// Рядом — только Telegram-геолокация
function initNearby() {
  const status = document.getElementById("geo-status");

  // Если не в Telegram — fallback
  if (!window.Telegram?.WebApp) {
    status.textContent = "Откройте в Telegram";
    createMap("nearby-map", 55.7558, 37.6176);
    return;
  }

  // Принудительно показываем кнопку "Поделиться геопозицией"
  Telegram.WebApp.MainButton.setText("Поделиться местоположением")
    .show()
    .onClick(() => {
      Telegram.WebApp.requestLocation()
        .then(pos => {
          Telegram.WebApp.MainButton.hide();
          status.textContent = "Вы здесь!";
          createMap("nearby-map", pos.latitude, pos.longitude);
          findCafes(pos.latitude, pos.longitude);
        })
        .catch(() => {
          status.textContent = "Вы отменили геолокацию";
          Telegram.WebApp.MainButton.hide();
          createMap("nearby-map", 55.7558, 37.6176);
        });
    });

  // Автоматический запрос (на случай, если разрешение уже есть)
  Telegram.WebApp.requestLocation()
    .then(pos => {
      Telegram.WebApp.MainButton.hide();
      status.textContent = "Вы здесь!";
      createMap("nearby-map", pos.latitude, pos.longitude);
      findCafes(pos.latitude, pos.longitude);
    })
    .catch(() => {
      status.textContent = "Нажмите кнопку ниже, чтобы поделиться местоположением";
      // Кнопка уже показана выше
    });
}

function createMap(container, lat, lng) {
  const map = new ymaps.Map(container, { center: [lat, lng], zoom: 15 });
  new ymaps.Placemark([lat, lng], { iconCaption: "Вы здесь" }, { preset: "islands#blueCircleDotIcon" }).addTo(map);
  window[container === "nearby-map" ? "nearbyMap" : "searchMap"] = map;
}

async function findCafes(lat, lng) {
  const res = await ymaps.geocode(`кафе near ${lat},${lng}`, { results: 10 });
  res.geoObjects.each(obj => {
    const c = obj.geometry.getCoordinates();
    const name = obj.properties.get("name") || "Кафе";
    const pm = new ymaps.Placemark(c, {
      balloonContent: `<strong>${name}</strong><br><button onclick="addFav('${name}',${c[0]},${c[1]})">В избранное</button>`
    });
    nearbyMap.geoObjects.add(pm);
  });
}

// Поиск
function initSearch() {
  searchMap = new ymaps.Map("search-map", { center: [55.7558, 37.6176], zoom: 10 });
  document.getElementById("search-btn").onclick = () => {
    const q = document.getElementById("search-input").value.trim();
    if (!q) return;
    ymaps.geocode(q).then(res => {
      const obj = res.geoObjects.get(0);
      const c = obj.geometry.getCoordinates();
      searchMap.setCenter(c, 16);
      new ymaps.Placemark(c, {
        balloonContent: `<strong>${obj.properties.get("text")}</strong><br><button onclick="addFav('${obj.properties.get("text")}',${c[0]},${c[1]})">В избранное</button>`
      }).addTo(searchMap);
    });
  };
}

// Избранное
function renderFavorites() {
  const list = document.getElementById("favorites-list");
  const btn = document.getElementById("clear-fav");
  list.innerHTML = favorites.map((f, i) => `
    <li onclick="openFav(${f.lat},${f.lng})">
      ${f.name}
      <button onclick="event.stopPropagation();remFav(${i})" style="float:right">✕</button>
    </li>`).join("");
  btn.style.display = favorites.length ? "block" : "none";
}
function addFav(name, lat, lng) {
  favorites.push({ name, lat, lng });
  localStorage.setItem("fav", JSON.stringify(favorites));
  renderFavorites();
  alert("Добавлено в избранное");
}
function remFav(i) {
  favorites.splice(i, 1);
  localStorage.setItem("fav", JSON.stringify(favorites));
  renderFavorites();
}
function openFav(lat, lng) {
  document.querySelector('[data-tab="nearby"]').click();
  createMap("nearby-map", lat, lng);
}
window.addFav = addFav;