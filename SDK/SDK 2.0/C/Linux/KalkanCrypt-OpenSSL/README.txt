---------------------------------------------------------------------------------------------------------------------------------------
ИНФОРМАЦИЯ ПО РАБОТЕ С БИБЛИОТЕКОЙ KALKANCRYPT-OPENSSL В СРЕДЕ ОС LINUX
---------------------------------------------------------------------------------------------------------------------------------------


Пример использование библиотек:
	Если вы используете динамическую библиотеку, то необходимо определить переменную окружения
	LD_LIBRARY_PATH и задать путь к папке с библиотеками. Например:
	export LD_LIBRARY_PATH=/home/ai/testeeee/lib:$LD_LIBRARY_PATH

	Простой пример компиляций c динамикой:
	gcc -o kncatest kncagosttest.c -I/<путь к заг. файлам>/include \
		-L/<путь к библиотекам>/lib -lcrypto

	Нужно подгрузить движок перед использованим. 
		ENGINE_load_gost();
		
	Если исходники на С++, заголовочные файлы надо включить через extern "C"


При работе с pkcs11 (внешними носителями), необходимы библиотеки (libpcsclite и zlib1g). 

        Пример компиляций с динамической библиотекой:
	gcc -o token main.c -I/<путь к заг. файлам>/include -L/<путь к библиотекам>/lib \
		-lpcsclite -L/<путь к библиотекам>/lib/engines -lkalkancrypto
	При работе с динамической, нужно добавить в LD_LIBRARY_PATH путь к папке с libkalkancrypto.so.

	Простой пример компиляций с использованием статической библиотки:
	gcc -o kncatest kncagosttest.c -I/home/ai/testeeee/include -L/home/ai/testeeee/lib -lcrypto -lz -ldl -lpcsclite

	В коде необходимо сначала подгрузить ГОСТ перед работой с ним.



Компиляция примера в SDK:

	Пример на С++ с использованием динамической библиотеки libkalkancrypto.so:
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(pwd)/dynamic/x64/
	g++ -Ldynamic/x64/ -Iinclude/ example/parsing_test.cpp  -lltdl -lkalkancrypto -lpthread -lz -ldl -lpcsclite -fPIC -o crypto_tool_cplusplus
	./crypto_tool_cplusplus
	
	Пример на С++ с использованием статической библиотеки:	
	g++ -Lstatic/x64/ -Iinclude/ example/parsing_test.cpp  -lltdl -lssl -lcrypto -lpthread -lz -ldl -lpcsclite -fPIC -o crypto_tool_cplusplus
	./crypto_tool_cplusplus
	
	Пример на С с использованием динамической библиотеки libkalkancrypto.so:
	export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(pwd)/dynamic/x64/	
	gcc -Ldynamic/x64/ -Iinclude/ example/parsing_test.c  -lltdl -lkalkancrypto -lpthread -lz -ldl -lpcsclite -fPIC -o crypto_tool
	./crypto_tool
	
	Пример на С с использованием статической библиотеки:	
	gcc -Lstatic/x64/ -Iinclude/ example/parsing_test.c  -lltdl -lssl -lcrypto -lpthread -lz -ldl -lpcsclite -fPIC -o crypto_tool
	./crypto_tool
	
