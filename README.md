# atd

Статический сайт на [Next.js](https://nextjs.org) (SSG, `output: "export"`) со стилями через CSS Modules. Сборка и публикация идут через GitHub Actions на GitHub Pages.

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Стили компонентов лежат рядом с ними в файлах `*.module.css`.

## Сборка

```bash
npm run build
npm run preview
```

`next build` генерирует статику в каталог `out/`. Для локальной проверки сборки как на GitHub Pages:

```bash
# PowerShell
$env:PAGES_BASE_PATH="/atd"
npm run build
npm run preview
```

## GitHub Pages

После первого пуша в `main` включите источник деплоя:

1. Repository **Settings** → **Pages**
2. **Build and deployment** → **Source**: GitHub Actions

Сайт будет доступен по адресу `https://shappoff.github.io/atd/`.

## Данные из Google Sheets

Населённые пункты извлекаются из Google-таблицы на этапе prebuild и сохраняются в `public/atdPlaces.json`. Для карты пишется отдельный `public/atdPlaces.geojson` (только точки с координатами) — MapLibre кластеризует их на GPU, без DOM-маркеров.

1. Скопируйте `.env.example` в `.env.local` и заполните `PROJECT_ID` / `GAPI_CREDENTIALS_*`.
2. Запустите извлечение:

```bash
npm run extract
```

`npm run build` тоже запускает extract. Если credentials нет, шаг пропускается и используется уже сохранённый JSON. Синхронизация карточек мест в Firebase Realtime Database тоже пропускается, пока не заданы `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` и `FIREBASE_PRIVATE_KEY`.

В GitHub Actions эти имена берутся из repository secrets (как в `.env.example`) и передаются в шаг Build. Без `NEXT_PUBLIC_FIREBASE_*` сайт собирается, но загрузка карточки места в браузере не заработает: Next вшивает эти переменные на этапе сборки.
`eparchy` — годы слева от колонки `kostel` (епархия), `atd` — годы справа (административно-территориальное деление).
