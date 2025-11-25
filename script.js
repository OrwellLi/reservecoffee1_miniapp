// Инициализация (добавь проверку Telegram WebApp, если нужно)
document.addEventListener('DOMContentLoaded', () => {
    ymaps.ready(() => {  // Ждём загрузки Яндекс API
        initTabs();
        initNearby();
        initSearch();
    });
    initFavorites();  // Избранное не зависит от карт
});

// Вкладки (без изменений)
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

// Вкладка 1: Рядом (геолокация + ближайшие места)
let nearbyMap;
function initNearby() {
    const status = document.getElementById('geo-status');
    ymaps.geolocation.get({
        provider: 'browser',  // Используем браузерную геолокацию
        mapStateAutoApply: false
    }).then((result) => {
        const position = result.geoObjects.get(0).geometry.getCoordinates();
        const lat = position[0];
        const lng = position[1];
        
        // Создаём карту
        nearbyMap = new ymaps.Map('nearby-map', {
            center: [lat, lng],
            zoom: 15
        });
        
        status.textContent = 'Позиция получена. Ищем места...';
        findNearbyPlaces(lat, lng);
    }).catch(() => {
        status.textContent = 'Разрешите доступ к геолокации.';
        // Fallback: Москва
        nearbyMap = new ymaps.Map('nearby-map', { center: [55.7558, 37.6176], zoom: 13 });
    });
}

async function findNearbyPlaces(lat, lng) {
    // Пример: поиск кафе рядом (используем geocode)
    const query = `кафе near ${lat}, ${lng}`;
    ymaps.geocode(query, { results: 5 }).then((res) => {
        res.geoObjects.each((obj) => {
            const coords = obj.geometry.getCoordinates();
            const name = obj.properties.get('name') || obj.properties.get('text');
            const myPlacemark = new ymaps.Placemark(coords, {
                balloonContent: `<b>${name}</b><br><button onclick="addToFavorites('${name}', ${coords[0]}, ${coords[1]})">Добавить в избранное</button>`
            });
            nearbyMap.geoObjects.add(myPlacemark);
        });
    });
}

// Вкладка 2: Поиск
let searchMap;
function initSearch() {
    searchMap = new ymaps.Map('search-map', { center: [55.7558, 37.6176], zoom: 10 });
}

document.getElementById('search-btn').addEventListener('click', () => {
    const input = document.getElementById('search-input').value;
    if (!input) return;
    
    ymaps.suggest(input).then((suggests) => {
        if (suggests.length > 0) {
            const first = suggests[0];
            ymaps.geocode(first.value).then((res) => {
                const coords = res.geoObjects.get(0).geometry.getCoordinates();
                searchMap.setCenter(coords, 15);
                const myPlacemark = new ymaps.Placemark(coords, {
                    balloonContent: `<b>${first.value}</b><br><button onclick="addToFavorites('${first.value}', ${coords[0]}, ${coords[1]})">Добавить в избранное</button>`
                });
                searchMap.geoObjects.add(myPlacemark);
            });
        }
    });
});

// Вкладка 3: Избранное (без изменений)
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
function initFavorites() {
    renderFavorites();
    document.getElementById('clear-fav').addEventListener('click', () => {
        favorites = [];
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    });
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    list.innerHTML = favorites.map((fav, index) => `
        <li>
            <span>${fav.name} (${fav.lat.toFixed(4)}, ${fav.lng.toFixed(4)})</span>
            <button onclick="removeFromFavorites(${index})">Удалить</button>
        </li>
    `).join('');
}

function addToFavorites(name, lat, lng) {
    favorites.push({ name, lat, lng });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    // Опционально: отправить на бэкенд (если есть)
    // fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, lat, lng }) });
}

function removeFromFavorites(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}