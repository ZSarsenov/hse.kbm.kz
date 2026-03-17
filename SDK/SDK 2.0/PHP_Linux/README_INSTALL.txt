
Чтобы знать какую именно версию библиотеки необходимо использовать, выполните команду: 	php -v


----------------------------------------php-cli----------------------------------------

Инструкция по установке библиотеки криптопровайдера kalkancrypt.so для php-cli в ОС Linux и запуска примера в командной строке:

Для успешной установки библиотеки kalkancrypt-php необходимо:
	
	1) Скопировать нужную версию библиотеки kalkancrypt.so в PHP-store-lib (путь можно узнать по команде php-config --extension-dir);
	2) В файле php.ini добавить строку: 'extension=kalkancrypt'



-------------------------------------php-mod и php-fpm-------------------------------------

Инструкция по настройке библиотеки криптопровайдера kalkancrypt-php на веб-серверах Apache и nginx на ОС Linux и запуска PHP-примера в браузере

Для успешной установки библиотеки kalkancrypt-php необходимо:
	1.	Установить на Ваш компьютер нужный Вам веб сервер Apache или Nginx;
	2.	Если у Вас nginx, установить php-fpm. Если Apache, установить php-mod;
	3.1.	Скопировать файл 'kalkancrypt.so' в PHP-store-lib (путь можно узнать по команде php-config --extension-dir);
	3.2.	В нужные ini-файлы добавить строку: 'extension=kalkancrypt'
			- для Apache: /etc/php/7.4/apache2/php.ini и /etc/php/7.4/apache2/conf.d/kalkancrypt.ini
			- для Nginx: /etc/php/7.4/fpm/conf.d/kalkancrypt.ini
	4.	Скопирвать файлы 'kalkanFlags&constants.php' и 'test.php' в /var/www/html/
	5.	В файле test.php изменить переменные: 
			- $container - путь к ключу *.p12; 
			- $password - пароль к сертификату;

	6.	Запустить test.php в браузере по адресу локального сервера.

Все указанные пути могут отличаться в зависимости от установленной версии и ОС Linux;
