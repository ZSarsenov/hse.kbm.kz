
-------------Инструкция по верификации библиотек kalkancrypt для Linux-------------

	- Для каждой библиотеки kalkancrypt были сгенерированы CMS в формате DER, ключом, выпущенным для АО "Национальные информационные технологии". 
	- Подпись сформирована от хэша библиотеки (в формате - hex).

	


	Пример проверки подписи (kalkancrypt.cms) методами системного OpenSSL:
		1) Верификация подписи. Извлечение подписанных данных(hash_from_cms.txt). Извлечение сертификата(cert.crt).
			openssl cms -verify -noverify -inform DER -in kalkancrypt.cms -certsout cert.crt -out hash_from_cms.txt

		2) Генерация хэша от библиотеки. 
			openssl dgst -sha256 -hex -out hash_lib.txt kalkancrypt.so 
		
		3) Сравнение двух хэшей: hash_from_cms.txt и hash_lib.txt
		
		4) Проверка сертификата. Удостовериться, что сертификат выдан АО "Национальные информационные технологии".