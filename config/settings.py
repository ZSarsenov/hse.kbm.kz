import os
from pathlib import Path
from dotenv import load_dotenv
import platform
from django.conf.global_settings import AUTH_USER_MODEL

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-&#9!0(96ik)j9&cytk*u10xgmbjk=fu_j4@+9cv9tpfo-nu2%@'

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition
INSTALLED_APPS = [
    # Наши приложения
    'core.apps.CoreConfig',
    'permits.apps.PermitsConfig',
    'users.apps.UsersConfig',
    'workflow.apps.WorkflowConfig',

    # Сторонние библиотеки
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'import_export',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.postgres',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]



MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # django-cors-headers
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases


# Определяем, на какой мы системе
IS_LINUX = platform.system() == 'Linux'

# Определяем имя базы в зависимости от условий
# Если это Linux, то смотрим путь (dev или prod), если Windows - то local
if IS_LINUX:
    # Простейшая проверка: если мы в папке 'prod', то это боевая база
    if '/web/prod' in str(BASE_DIR):
         DB_NAME = 'end.kbm.kz'
    # Если мы в папке 'dev', то это тестовая база
    elif '/web/dev' in str(BASE_DIR):
         DB_NAME = 'end_kbm_dev'
    else:
         # Запасной вариант для Linux
         DB_NAME = 'end_kbm_dev'
else:
    # Если это Windows
    DB_NAME = 'hse.kbm.kz_local'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'hse.kbm.kz_local',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # Мы используем токены для аутентификации API-запросов
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # Если не указано иное, доступ только для аутентифицированных
        'rest_framework.permissions.IsAuthenticated',
    ]
}

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://10.60.2.89:3000",
]

CORS_ALLOW_CREDENTIALS = True


# URL, по которому файлы будут доступны в браузере
MEDIA_URL = '/permits_scans/'

# Папка на компьютере, куда физически сохраняются файлы
MEDIA_ROOT = os.path.join(BASE_DIR, 'permits_scans')