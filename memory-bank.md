# Memory Bank — HSE Caspian Bitum

> Перед началом работы ИИ должен прочитать этот файл полностью.

---

## Проект

Электронная система Нарядов-Допусков (HSE) для ТОО «Каспий Битум».
Управление нарядами-допусками на опасные работы (огневые, газоопасные, на высоте, электротехнические, LOTO) с цепочкой согласований и ЭЦП НУЦ РК.

### Стек
- Backend: Python 3.12 + Django 5.2.8 + DRF + django-fsm + PostgreSQL 14
- Frontend: React 19 + TypeScript + Vite 6 + TailwindCSS + i18next (RU/KK)
- Подпись: ЭЦП через NCALayer (Kalkan)
- Генерация: docxtpl, reportlab, qrcode
- WSGI: Gunicorn + Nginx (reverse proxy)
- ОС: Ubuntu 22.04.5 LTS

### История
Исходный код от АО «Каражанбасмунай» (kbm.kz), репо https://github.com/ZSarsenov/hse.kbm.kz.git.
Клонирован и отребрендирован для ТОО «Каспий Битум» (CB).

---

## Сервер CB

- Внешний IP: 188.127.33.5
- Внутренний IP: 10.108.2.38
- Пользователь: admin_cb (uid 1000, группы: sudo)
- PostgreSQL: postgres / postgres (только localhost)
- Django superuser dev: cb_admin
- Django superuser prod: cb_prod_admin / changeme

### Целевая архитектура
```
[Внутренняя сеть CB]
    │
    ▼
[10.108.2.38]
    ├─ Nginx :80   → /web/prod/ (пользователи)
    │              → /web/dev/  :8080 (разработка)
    ├─ Gunicorn (prod) → /web/prod/hse_project.sock → cb_kz_prod
    ├─ Gunicorn (dev)  → /web/dev/hse_project.sock  → cb_kz
    └─ PostgreSQL :5432 (две БД)
```

---

## Текущие пути

### DEV (`/home/sadmin/web/dev/`)
| Ресурс | Путь |
|---|---|
| Код | `/home/sadmin/web/dev/` |
| venv | `/home/sadmin/web/dev/venv/` (Python 3.12) |
| .env | `/home/sadmin/web/dev/.env` (mode 600) |
| Сокет | `/home/sadmin/web/dev/hse_project.sock` |
| Фронтенд build | `/home/sadmin/web/dev/frontend/dist/` |
| Статика | `/home/sadmin/web/dev/staticfiles/` |
| Media | `/home/sadmin/web/dev/permits_scans/` |
| Systemd | `/etc/systemd/system/gunicorn_hse.service` |
| Nginx | `/etc/nginx/sites-available/hse` → `sites-enabled/hse` |

### PROD (`/home/sadmin/web/prod/`)
| Ресурс | Путь |
|---|---|
| Код | `/home/sadmin/web/prod/` |
| venv | `/home/sadmin/web/prod/venv/` |
| .env | `/home/sadmin/web/prod/.env` (DEBUG=False) |
| Сокет | `/home/sadmin/web/prod/hse_project.sock` (ещё не запущен) |
| Фронтенд build | `/home/sadmin/web/prod/frontend/dist/` |
| Статика | `/home/sadmin/web/prod/staticfiles/` |
| Systemd | `gunicorn_hse_prod.service` (файл есть, НЕ установлен) |
| Nginx | `nginx-hse-prod.conf` (файл есть, НЕ установлен) |

---

## Что сделано (сессия 2026-06-09)

### Ребрендинг KBM → CB (32 упоминания в 16 файлах)
- `users/models.py` — company_name default: `'ТОО Каспий Битум'`, BIN: `'000000000000'`
- `users/migrations/0007_rebrand_to_cb.py` — миграция
- `permits/views.py` — БИН-fallback, HSE_BASE_URL, UI тексты, system prompt
- `config/settings.py` — DB fallback имена, CORS origins (10.108.2.38)
- `core/signature.py` — комментарии
- `frontend/index.html`, `App.tsx`, `CreatePermit.tsx`, `CreatePermit_check_list.tsx`, `ElectricalPermitForm.tsx`, `PermitPrintView.tsx` — все тексты
- `frontend/src/locales/ru.json` — «АО Каражанбасмунай» → «ТОО Каспий Битум»
- `frontend/src/locales/kk.json` — «Қаражанбасмұнай» АҚ → «Каспий Битум» ЖШС

### PROD-окружение создано
- `/home/sadmin/web/prod/` скопирован из dev (без venv, node_modules, dist)
- venv создан, зависимости установлены, gunicorn установлен
- `.env` создан (DEBUG=False, свой SECRET_KEY)
- БД `cb_kz_prod` создана
- Миграции применены
- `collectstatic` выполнен
- Суперпользователь `cb_prod_admin` / `changeme` создан
- Фронтенд собран (`npm run build`)

### Git
- Коммит `a9a9b7a`: "Ребрендинг: KBM → ТОО Каспий Битум (CB)"
- НЕ запушен в GitHub (нужен новый репозиторий)

### Подготовленные файлы
- `setup_prod.sh` — полный скрипт развёртывания PROD
- `gunicorn_hse_prod.service` — systemd-юнит для prod
- `nginx-hse-prod.conf` — Nginx: prod на :80, dev на :8080
- `backup_cb_prod.sh` — ежедневный бэкап БД + ротация (30 дней)

---

## Что НЕ сделано (требует действий)

1. **Установить systemd prod**: `sudo cp gunicorn_hse_prod.service /etc/systemd/system/`, `systemctl daemon-reload && enable --now`
2. **Установить Nginx новый конфиг**: удалить старый симлинк `hse`, создать на `nginx-hse-prod`, `nginx -t && reload`
3. **Настроить бэкап**: `mkdir /home/sadmin/backups`, скопировать `backup_cb_prod.sh`, добавить в crontab
4. **Открыть порт 8080** в ufw: `sudo ufw allow 8080/tcp`
5. **Создать GitHub репозиторий** для CB и запушнить
6. **Узнать реальный БИН** ТОО «Каспий Битум» и заменить `000000000000`
7. **Заменить шапку DOCX** в `templates/docx/dangerous_permits_rus.docx` на реквизиты CB (вручную в Word)
8. **Логотип**: при необходимости заменить `frontend/public/favicon.png`

> Все команды для пунктов 1–4 требуют sudo. Они перечислены в конце этой сессии чата.

---

## Архитектурные решения

### БД определяется из .env (с fallback)
`config/settings.py:93-104` — сначала читает `DB_NAME` из `.env`, если нет — fallback на старую path-based логику. Для prod `.env` имеет `DB_NAME=cb_kz_prod`.

### Разделение dev/prod
- Разные БД (`cb_kz` / `cb_kz_prod`)
- Разные сокеты (`/dev/hse_project.sock` / `/prod/hse_project.sock`)
- Разные порты Nginx (:8080 / :80)
- Разные .env (DEBUG=True / DEBUG=False, разные SECRET_KEY)

### БИН организации
Хранится в `users.User.bin` (default). Используется при ЭЦП-подписи: `permits/views.py:524` сверяет БИН из сертификата с БИН пользователя (fallback на default).

---

## Известные проблемы и решения

_Пока нет. Добавлять по мере возникновения._

