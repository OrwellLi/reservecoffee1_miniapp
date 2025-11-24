// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initNearby();
    initSearch();
    initFavorites();
});

// Вкладки
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
    nearbyMap = L.map('nearby-map').setView([55.7558, 37.6176], 13); // Москва по умолчанию
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(nearbyMap);
    
    const status = document.getElementById('geo-status');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                nearbyMap.setView([lat, lng], 13);
                status.textContent = 'Позиция получена. Ищем места...';
                findNearbyPlaces(lat, lng);
            },
            () => {
                status.textContent = 'Разрешите доступ к геолокации.';
            }
        );
    } else {
        status.textContent = 'Геолокация не поддерживается.';
    }
}

async function findNearbyPlaces(lat, lng) {
    // Пример: поиск кафе в радиусе (используем Nominatim)
    const query = `cafe near ${lat},${lng}`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&bounded=1`);
    const places = await response.json();
    places.forEach(place => {
        L.marker([place.lat, place.lon]).addTo(nearbyMap)
            .bindPopup(`<b>${place.display_name.split(',')[0]}</b><br><button onclick="addToFavorites('${place.display_name}', ${place.lat}, ${place.lon})">Добавить в избранное</button>`)
            .openPopup();
    });
}

// Вкладка 2: Поиск
let searchMap, searchControl;
function initSearch() {
    searchMap = L.map('search-map').setView([55.7558, 37.6176], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(searchMap);
    
    const provider = new GeoSearch.OpenStreetMapProvider();
    searchControl = new GeoSearch.GeoSearchControl({
        provider: provider,
        position: 'topleft',
        autoComplete: true,
        autoCompleteDelay: 250,
    });
    searchMap.addControl(searchControl);
    
    document.getElementById('search-btn').addEventListener('click', () => {
        const input = document.getElementById('search-input');
        provider.search({ query: input.value }).then(results => {
            if (results.length > 0) {
                searchMap.setView([results[0].y, results[0].x], 15);
                L.marker([results[0].y, results[0].x]).addTo(searchMap)
                    .bindPopup(`<b>${results[0].label}</b><br><button onclick="addToFavorites('${results[0].label}', ${results[0].y}, ${results[0].x})">Добавить в избранное</button>`);
            }
        });
    });
}

// Вкладка 3: Избранное
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
    // Опционально: отправить на бэкенд
    fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lat, lng })
    });
}

function removeFromFavorites(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}