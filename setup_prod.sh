#!/bin/bash
# Скрипт развёртывания PROD-окружения для Caspian Bitum HSE
# Запуск: sudo bash setup_prod.sh

set -e

PROD_DIR="/home/sadmin/web/prod"
DEV_DIR="/home/sadmin/web/dev"
VENV_DIR="$PROD_DIR/venv"

echo "=== Развёртывание PROD-окружения HSE Caspian Bitum ==="

# 1. Клонирование (или копирование) репозитория
if [ -d "$PROD_DIR/.git" ]; then
    echo "[1/8] Обновление репозитория prod..."
    sudo -u admin_cb git -C "$PROD_DIR" pull
else
    echo "[1/8] Создание prod-папки..."
    # Если есть ссылка на GitHub, делаем clone; иначе копируем из dev
    read -p "Введите URL GitHub-репозитория (или нажмите Enter чтобы скопировать из dev): " REPO_URL
    if [ -n "$REPO_URL" ]; then
        sudo -u admin_cb git clone "$REPO_URL" "$PROD_DIR"
    else
        echo "Копирование кода из dev в prod..."
        rsync -av --exclude='.git' --exclude='venv' --exclude='node_modules' --exclude='frontend/dist' --exclude='frontend/node_modules' --exclude='permits_scans' --exclude='staticfiles' --exclude='__pycache__' --exclude='*.pyc' "$DEV_DIR/" "$PROD_DIR/"
    fi
fi

# 2. Создание venv
echo "[2/8] Создание виртуального окружения..."
python3.12 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install -r "$PROD_DIR/requirements.txt"
"$VENV_DIR/bin/pip" install gunicorn

# 3. Генерация SECRET_KEY
echo "[3/8] Создание .env..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
cat > "$PROD_DIR/.env" <<EOF
DEBUG=False
SECRET_KEY=$SECRET_KEY
DEEPSEEK_API_KEY=

DB_NAME=cb_kz_prod
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
EOF
chmod 600 "$PROD_DIR/.env"

# 4. Создание БД
echo "[4/8] Создание базы данных cb_kz_prod..."
sudo -u postgres psql -c "CREATE DATABASE cb_kz_prod OWNER postgres;" 2>/dev/null || echo "БД cb_kz_prod уже существует"

# 5. Миграции и collectstatic
echo "[5/8] Применение миграций..."
"$VENV_DIR/bin/python" "$PROD_DIR/manage.py" migrate
echo "[6/8] Сбор статики..."
"$VENV_DIR/bin/python" "$PROD_DIR/manage.py" collectstatic --noinput

# 6. Создание суперпользователя (если не существует)
echo "[7/8] Создание суперпользователя..."
echo "from users.models import User; User.objects.create_superuser('cb_prod_admin', password='changeme') if not User.objects.filter(username='cb_prod_admin').exists() else print('Суперпользователь уже существует')" | "$VENV_DIR/bin/python" "$PROD_DIR/manage.py" shell

# 7. Сборка фронтенда
echo "[8/8] Сборка фронтенда..."
if [ -d "$PROD_DIR/frontend" ]; then
    npm --prefix "$PROD_DIR/frontend" install
    npm --prefix "$PROD_DIR/frontend" run build
fi

echo ""
echo "=== PROD-окружение развёрнуто ==="
echo "Далее:"
echo "  1. Скопировать gunicorn_hse_prod.service → /etc/systemd/system/"
echo "  2. Скопировать nginx-hse-prod.conf → /etc/nginx/sites-available/"
echo "  3. sudo systemctl daemon-reload"
echo "  4. sudo systemctl enable --now gunicorn_hse_prod"
echo "  5. sudo ln -s /etc/nginx/sites-available/nginx-hse-prod /etc/nginx/sites-enabled/"
echo "  6. sudo nginx -t && sudo systemctl reload nginx"
echo "  7. Настроить бэкап: crontab -e (см. backup_cb_prod.sh)"
