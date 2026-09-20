# GearLab: AI Project Context

Этот файл предназначен для GLM 5.2 и других AI-агентов, которые работают с проектом GearLab.
Перед изменением кода прочитай этот файл, затем изучи конкретные файлы, которых касается задача.

## 1. Назначение проекта

GearLab — русскоязычный интерактивный сайт о геймерской периферии.

Основные направления:

- база игровых мышей;
- база клавиатур;
- база ковриков для мыши;
- база глайдов и скейтов;
- фильтрация товаров;
- сравнение устройств;
- калькулятор совместимого сетапа;
- конвертер sensitivity между играми;
- SEO-гайды и структурированные данные schema.org.

Это не интернет-магазин. Цены и характеристики являются справочными данными и должны быть явно проверены перед публикацией как официальные.

## 2. Технологический стек

- Next.js 16.3.3;
- App Router;
- TypeScript в strict-режиме;
- React;
- Tailwind CSS 4;
- Turbopack;
- локальные TypeScript-массивы вместо внешней базы данных;
- русский язык интерфейса.

Команды Windows:

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

Не используй `npm` в PowerShell, если он блокируется execution policy. Используй `npm.cmd`.

Локальный адрес:

```text
http://localhost:3000
```

## 3. Структура проекта

```text
gearlab/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                         # главная
│  │  ├─ layout.tsx                       # общий layout, metadata, HeaderNav
│  │  ├─ globals.css                      # дизайн-система и глобальные стили
│  │  ├─ database/
│  │  │  ├─ page.tsx                      # хаб базы
│  │  │  ├─ mice/page.tsx                 # каталог мышей
│  │  │  ├─ mice/[slug]/page.tsx          # карточка мыши
│  │  │  ├─ mice/f/[facet]/page.tsx       # SEO-фасеты мышей
│  │  │  ├─ keyboards/page.tsx            # каталог клавиатур
│  │  │  ├─ keyboards/[slug]/page.tsx     # карточка клавиатуры
│  │  │  ├─ pads/page.tsx                 # каталог ковриков
│  │  │  └─ glides/page.tsx                # каталог глайдов
│  │  ├─ compare/page.tsx                 # сравнение мышей, ковриков, глайдов
│  │  ├─ tools/calculator/page.tsx        # подбор полного сетапа
│  │  ├─ tools/sens-calculator/page.tsx   # конвертер sensitivity
│  │  ├─ guides/page.tsx                  # каталог гайдов
│  │  ├─ guides/warface-sens/page.tsx     # гайд Warface → Valorant/CS2
│  │  ├─ reviews/page.tsx                 # раздел обзоров
│  │  ├─ sitemap.ts                        # sitemap.xml
│  │  ├─ robots.ts                         # robots.txt
│  │  └─ opengraph-image.tsx              # общая OG-картинка
│  ├─ components/
│  │  ├─ HeaderNav.tsx                    # responsive desktop/mobile navigation
│  │  ├─ MiceCatalog.tsx                  # клиентские фильтры мышей
│  │  ├─ KeyboardCatalog.tsx              # клиентские фильтры клавиатур
│  │  ├─ MouseCard.tsx                    # карточка мыши
│  │  ├─ CompareTool.tsx                  # UI сравнения
│  │  ├─ Calculator.tsx                   # UI калькулятора сетапа
│  │  └─ SensConverter.tsx                # UI и расчёты sensitivity
│  ├─ data/
│  │  ├─ gear.ts                          # мыши, коврики, глайды
│  │  ├─ keyboards.ts                     # клавиатуры
│  │  └─ facets.ts                        # SEO-фасеты мышей
│  └─ lib/
│     ├─ types.ts                         # основные TypeScript-типы
│     ├─ calculator.ts                    # правила подбора бандлов
│     ├─ labels.ts                        # русские подписи enum-значений
│     └─ schema.ts                        # JSON-LD/schema.org helpers
├─ public/                                # статические assets
├─ package.json
├─ tsconfig.json
├─ next.config.ts
└─ AI_CONTEXT.md                          # этот файл
```

## 4. Основные типы данных

Файл: `src/lib/types.ts`.

### Mouse

Ключевые поля: `slug`, `brand`, `name`, `sensor`, `dpiMax`, `weightG`, `shape`, `grips`, `connectivity`, `pollingHz`, `motionSync`, `switches`, `clickLatencyMs`, `handSize`, `priceUsd`, `profiles`.

Дополнительные поля: `dimensionsMm`, `batteryMah`, `batteryLifeH`, `coating`, `mcu`.

### Mousepad

Ключевые поля: `slug`, `brand`, `name`, `surface`, `thicknessMm`, `stitchedEdges`, `base`, `glideSpeedIndex`, `priceUsd`.

Физические поля cisA для будущего калькулятора синергии:

- `dynamicFrictionX`;
- `dynamicFrictionY`;
- `staticFrictionX`;
- `staticFrictionY`;
- `surfaceTexture`;
- `thickness`.

`thicknessMm` и `thickness` сейчас существуют одновременно для совместимости с текущими компонентами. При новых изменениях не удаляй ни одно поле без проверки всех usages.

### Keyboard

Ключевые поля: `slug`, `brand`, `name`, `layout`, `switches`, `actuationG`, `hotSwap`, `connectivity`, `mount`, `pollRateHz`, `hallEffect`, `rapidTrigger`, `priceUsd`, `profiles`.

## 5. Правила работы с данными

- Не добавляй дубликаты по смыслу или по `slug`.
- Перед добавлением новой модели ищи её имя и slug через Grep.
- Для новых записей используй реальные характеристики из официального источника или предоставленной пользователем таблицы.
- Не подставляй случайные числа вместо неизвестных характеристик.
- Если точное значение не подтверждено, остановись и укажи, какое поле требует источника.
- `pollingHz: 8000` означает заявленную поддержку 8K, но не доказывает качество реализации или стабильность беспроводного режима.
- Не меняй существующие пользовательские характеристики без явного объяснения.
- Slug должен быть стабильным: он используется в URL, sitemap, ссылках и `generateStaticParams`.
- Все отображаемые пользователю подписи должны быть на русском, если компонент не является техническим.

## 6. Sens-конвертер

Файл: `src/components/SensConverter.tsx`.

Расчёты:

```text
cm/360 = 914.4 / (yaw × sensitivity × DPI)
sens₂ = (yaw₁ × sens₁ × DPI₁) / (yaw₂ × DPI₂)
```

Текущие игровые профили и коэффициенты:

- Warface: `0.00333`;
- CS2 / Apex Legends: `0.022`;
- Valorant: `0.07`;
- Overwatch 2: `0.0066`;
- PUBG: `0.002`;
- Fortnite: `0.005555`;
- Rainbow Six Siege: `0.00223`.

При изменении коэффициента обязательно проверь пример Warface `7.33 @ 800 DPI` → Valorant `0.348699 @ 800 DPI`.

## 7. Дизайн-система

Сохраняй существующий визуальный язык:

- фон: `#0B0B10`;
- volt-акцент: `#C6FF00`;
- cyan/neon-акцент: `#00E5FF`;
- используются классы `.card`, `.chip`, `.chip-active`, `.glow-volt`, `.mono`;
- интерфейс тёмный, техничный, с моноширинными техническими подписями;
- страницы должны нормально работать на мобильных экранах.

Не превращай интерфейс в стандартный шаблон из одинаковых карточек. Сохраняй существующую структуру и плотность контента.

## 8. SEO и маршруты

- Для страниц добавляй `metadata` с уникальными `title` и `description`.
- Для товарных страниц используй существующие helpers из `src/lib/schema.ts`.
- Для новых динамических страниц обновляй `generateStaticParams`, если он используется.
- Для новых важных URL обновляй `src/app/sitemap.ts`.
- Не указывай `https://gearlab.example` как реальный коммерческий домен, пока домен не заменён на настоящий.
- Query-параметры в typed `Link` Next.js оформляй объектом `{ pathname, query }`.
- В Next.js 16 `params` в App Router могут быть асинхронными: используй `await props.params` там, где это требуется типами проекта.

## 9. Алгоритм перед изменением кода

1. Прочитать этот файл.
2. Найти существующие записи и usages через Grep.
3. Прочитать соседние компоненты и типы.
4. Внести минимальное изменение без массовой перестройки.
5. Проверить `npm.cmd run build`.
6. Проверить `npm.cmd run lint`.
7. Проверить новые URL через `http://localhost:3000`.
8. В итоговом ответе перечислить изменённые файлы, проверки и неподтверждённые данные.

## 10. Ограничения проекта

- Внешняя БД пока не подключена.
- Данные хранятся в TypeScript-файлах и собираются статически.
- Цены не являются live-ценами.
- Не добавляй авторизацию, платежи, CMS или API без отдельного задания.
- Не удаляй пользовательские изменения из рабочей директории.
- Не создавай секреты, ключи API или реальные credentials в репозитории.

## 11. Формат ответа AI-агента

Отвечай кратко и технически:

- что изменено;
- какие файлы затронуты;
- какие команды проверки выполнены;
- какие данные требуют подтверждения;
- что осталось сделать.

Не утверждай, что данные точные, если источник не был проверен.
