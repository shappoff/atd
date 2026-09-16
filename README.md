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

Населённые пункты извлекаются из Google-таблицы на этапе prebuild и сохраняются в `public/atdPlaces.json`.

1. Скопируйте `.env.example` в `.env.local` и заполните `PROJECT_ID` / `GAPI_CREDENTIALS_*`.
2. Запустите извлечение:

```bash
npm run extract
```

`npm run build` тоже запускает extract. Если credentials нет (например, в GitHub Actions), шаг пропускается и используется уже сохранённый JSON.
`eparchy` — годы слева от колонки `kostel` (епархия), `atd` — годы справа (административно-территориальное деление).
