Версия knca_provider_util для работы с тестовыми ключами
Использует хранилище только с тестовыми корневыми сертификатами.

Замена основной версии knca_provider_util:
1. Найти в ncalayer-cache папку с модулем. В каждой папке bundleX имеется файл bundle.info, содержащий оригинальное имя файла
Например,
file:bundles/knca_provider_util-0.8.jar
или
file:bundles/kz.gov.pki.provider.knca_provider_util_0.8_2d9f7582-2156-4d7c-94cd-4469000d572d.jar
2. Перейти в папку bundleX\version0.0
3. Удалить bundle.jar, скопировать тестовую версию и переименовать в bundle.jar
4. Запустить NCALayer. В "Управлении модулями" поле "Установленная версия" покажет версию TEST.