// Проверка на Telegram WebApp
const isTelegram = typeof Telegram !== 'undefined' && Telegram.WebApp;

// Инициализация с обработкой ошибок
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ymaps === 'undefined') {
        console.error('Yandex Maps API не загружен. Проверь ключ и CSP.');
        document.getElementById('geo-status').textContent = 'Ошибка загрузки карты. Проверь интернет.';
        return;
    }
    
    ymaps.ready(() => {
        console.log('Yandex Maps готов!');
        initTabs();
        initNearby();
        initSearch();
    }).catch(err => {
        console.error('Ошибка ymaps.ready():', err);
    });
    
    initFavorites();
});

// Вкладки (с проверкой элементов)
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    if (tabs.length === 0) {
        console.error('Кнопки вкладок не найдены!');
        return;
    }
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
    console.log('Вкладки инициализированы');
}

// Вкладка 1: Рядом
let nearbyMap;
function initNearby() {
    const status = document.getElementById('geo-status');
    if (!status) return;
    
    // В Telegram используем requestLocation для лучшей совместимости
    if (isTelegram) {
        Telegram.WebApp.requestLocation().then(position => {
            const lat = position.latitude;
            const lng = position.longitude;
            createNearbyMap(lat, lng);
            status.textContent = 'Позиция получена. Ищем места...';
            findNearbyPlaces(lat, lng);
        }).catch(() => {
            status.textContent = 'Разрешите геолокацию в настройках.';
            createNearbyMap(55.7558, 37.6176); // Fallback: Москва
        });
    } else {
        // Обычная геолокация
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    createNearbyMap(lat, lng);
                    status.textContent = 'Позиция получена. Ищем места...';
                    findNearbyPlaces(lat, lng);
                },
                () => {
                    status.textContent = 'Разрешите геолокацию.';
                    createNearbyMap(55.7558, 37.6176);
                }
            );
        } else {
            status.textContent = 'Геолокация не поддерживается.';
            createNearbyMap(55.7558, 37.6176);
        }
    }
}

function createNearbyMap(lat, lng) {
    nearbyMap = new ymaps.Map('nearby-map', {
        center: [lat, lng],
        zoom: 15
    });
    console.log('Карта "Рядом" создана');
}

async function findNearbyPlaces(lat, lng) {
    if (!nearbyMap) return;
    try {
        const query = `кафе near ${lat}, ${lng}`;
        const res = await ymaps.geocode(query, { results: 5 });
        res.geoObjects.each((obj) => {
            const coords = obj.geometry.getCoordinates();
            const name = obj.properties.get('name') || obj.properties.get('text') || 'Место';
            const placemark = new ymaps.Placemark(coords, {
                balloonContent: `<b>${name}</b><br><button class="add-fav-btn" onclick="addToFavorites('${name}', ${coords[0]}, ${coords[1]})">Добавить в избранное</button>`
            });
            nearbyMap.geoObjects.add(placemark);
        });
        console.log('Места добавлены на карту');
    } catch (err) {
        console.error('Ошибка поиска мест:', err);
    }
}

// Вкладка 2: Поиск
let searchMap;
function initSearch() {
    searchMap = new ymaps.Map('search-map', { center: [55.7558, 37.6176], zoom: 10 });
    console.log('Карта "Поиск" создана');
    
    // Кнопка поиска (с проверкой)
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    } else {
        console.error('Кнопка поиска не найдена!');
    }
}

function handleSearch() {
    const input = document.getElementById('search-input');
    if (!input || !input.value) {
        alert('Введите запрос!');
        return;
    }
    const query = input.value;
    
    ymaps.suggest(query).then(suggests => {
        if (suggests.length === 0) return alert('Ничего не найдено');
        const first = suggests[0];
        ymaps.geocode(first.value).then(res => {
            const coords = res.geoObjects.get(0).geometry.getCoordinates();
            searchMap.setCenter(coords, 15);
            const placemark = new ymaps.Placemark(coords, {
                balloonContent: `<b>${first.value}</b><br><button class="add-fav-btn" onclick="addToFavorites('${first.value}', ${coords[0]}, ${coords[1]})">Добавить в избранное</button>`
            });
            searchMap.geoObjects.add(placemark);
        }).catch(err => console.error('Ошибка геокода:', err));
    }).catch(err => console.error('Ошибка suggest:', err));
}

// Вкладка 3: Избранное (без изменений, но с логами)
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
function initFavorites() {
    renderFavorites();
    const clearBtn = document.getElementById('clear-fav');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            favorites = [];
            localStorage.setItem('favorites', JSON.stringify(favorites));
            renderFavorites();
        });
    }
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;
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
    console.log('Добавлено в избранное:', name);
}

function removeFromFavorites(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// Telegram интеграция (опционально, для MainButton)
if (isTelegram) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
    Telegram.WebApp.MainButton.setText('Обновить карту').onClick(() => location.reload()).show();
}