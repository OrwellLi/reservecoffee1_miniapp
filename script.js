// ПЛЕЙСХОЛДЕР ДЛЯ КЛЮЧА (заменяется на Vercel при npm run build)
const API_KEY_PLACEHOLDER = 'your-key-here';

// Глобальные переменные
let nearbyMap, searchMap;
const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// === ЗАГРУЗКА ЯНДЕКС КАРТ ===
document.addEventListener('DOMContentLoaded', () => {
    if (API_KEY_PLACEHOLDER === 'your-key-here') {
        document.body.innerHTML += '<div style="padding:20px;background:red;color:white;text-align:center;">ОШИБКА: ключ Яндекса не подставлен!</div>';
        return;
    }

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${API_KEY_PLACEHOLDER}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
        console.log('Yandex Maps API загружен');
        ymaps.ready(initApp);
    };
    script.onerror = () => console.error('Ошибка загрузки Yandex Maps');
    document.head.appendChild(script);
});

function initApp() {
    initTabs();
    initNearby();
    initSearch();
    initFavorites();
}

// === ВКЛАДКИ ===
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

// === ВКЛАДКА "РЯДОМ" — ГЕОЛОКАЦИЯ ЧЕРЕЗ TELEGRAM ===
function initNearby() {
    const statusEl = document.getElementById('geo-status');

    if (window.Telegram?.WebApp) {
        Telegram.WebApp.requestLocation()
            .then(loc => {
                statusEl.textContent = 'Вы здесь!';
                createNearbyMap(loc.latitude, loc.longitude);
                findNearbyPlaces(loc.latitude, loc.longitude);
            })
            .catch(() => {
                statusEl.textContent = 'Разрешите доступ к местоположению в Telegram';
                createNearbyMap(55.7558, 37.6176); // Москва fallback
            });
    } else {
        statusEl.textContent = 'Откройте в Telegram';
        createNearbyMap(55.7558, 37.6176);
    }
}

function createNearbyMap(lat, lng) {
    nearbyMap = new ymaps.Map('nearby-map', {
        center: [lat, lng],
        zoom: 15,
        controls: ['zoomControl']
    });

    new ymaps.Placemark([lat, lng], {
        hintContent: 'Вы здесь',
        balloonContent: 'Ваше местоположение'
    }, {
        preset: 'islands#blueCircleDotIcon',
        iconColor: '#3b82f6'
    }).addTo(nearbyMap);
}

async function findNearbyPlaces(lat, lng) {
    try {
        const res = await ymaps.geocode(`кафе near ${lat},${lng}`, { results: 8 });
        res.geoObjects.each(obj => {
            const coords = obj.geometry.getCoordinates();
            const name = obj.properties.get('name') || obj.properties.get('text') || 'Кафе';
            const placemark = new ymaps.Placemark(coords, {
                balloonContent: `<b>${name}</b><br><button onclick="addToFavorites('${name}',${coords[0]},${coords[1]})" style="margin-top:8px;padding:6px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">В избранное ⭐</button>`
            });
            nearbyMap.geoObjects.add(placemark);
        });
    } catch (e) {
        console.error('Ошибка поиска мест:', e);
    }
}

// === ВКЛАДКА "ПОИСК" ===
function initSearch() {
    searchMap = new ymaps.Map('search-map', { center: [55.7558, 37.6176], zoom: 10 });

    document.getElementById('search-btn').addEventListener('click', () => {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        ymaps.suggest(query).then(items => {
            if (items.length === 0) return alert('Ничего не найдено');
            ymaps.geocode(items[0].value).then(res => {
                const obj = res.geoObjects.get(0);
                const coords = obj.geometry.getCoordinates();
                searchMap.setCenter(coords, 16);
                new ymaps.Placemark(coords, {
                    balloonContent: `<b>${items[0].displayName}</b><br><button onclick="addToFavorites('${items[0].displayName}',${coords[0]},${coords[1]})" style="margin-top:8px;padding:6px 12px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">В избранное ⭐</button>`
                }).addTo(searchMap);
            });
        });
    });
}

// === ИЗБРАННОЕ ===
function initFavorites() {
    renderFavorites();
    document.getElementById('clear-fav').addEventListener('click', () => {
        if (confirm('Очистить избранное?')) {
            localStorage.removeItem('favorites');
            location.reload();
        }
    });
}

function renderFavorites() {
    const list = document.getElementById('favorites-list');
    const empty = document.getElementById('favorites-empty');
    const clearBtn = document.getElementById('clear-fav');

    if (favorites.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        clearBtn.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    clearBtn.style.display = 'block';

    list.innerHTML = favorites.map((f, i) => `
        <li style="padding:12px;background:white;margin:8px 0;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <span><b>${f.name}</b></span>
            <div>
                <button onclick="openInMap(${f.lat},${f.lng})" style="margin-right:8px;padding:6px 10px;background:#28a745;color:white;border:none;border-radius:4px;">Открыть</button>
                <button onclick="removeFromFavorites(${i})" style="padding:6px 10px;background:#dc3545;color:white;border:none;border-radius:4px;">✕</button>
            </div>
        </li>
    `).join('');
}

function addToFavorites(name, lat, lng) {
    favorites.push({ name, lat, lng });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    alert('Добавлено в избранное ⭐');
}

function removeFromFavorites(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

function openInMap(lat, lng) {
    document.querySelector('[data-tab="nearby"]').click();
    createNearbyMap(lat, lng);
}

// Глобально доступная функция для кнопок в балунах
window.addToFavorites = addToFavorites;