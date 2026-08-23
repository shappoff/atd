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
