#include "stdafx.h"
#include <windows.h>
#include <iostream>
#include <time.h>

#include <string.h>
#include "KalkanCrypt.h"

#define CERT_LENGTH 32768
#define LENGHT 65196
#define LENGHT_STAND 8192
#define DATA_LENGHT 2048
#define scanf(a,b) scanf_s(a,b)

typedef int(*KC_GetFunctionList1)(stKCFunctionsType **KCfunc);
KC_GetFunctionList1 lib_funcList = NULL;
stKCFunctionsType *kc_funcs;

int main()
{
	SetConsoleCP(1251);
	SetConsoleOutputCP(1251);

	unsigned int rv = 0;
	HMODULE hKCModule = NULL;
	hKCModule = LoadLibrary(L"KalkanCrypt_x64.dll");
	if (!hKCModule) {
		DWORD tmprv = ::GetLastError();
		std::cout << tmprv;
		return S_FALSE;
	}
	lib_funcList = (int(*)(stKCFunctionsType **))GetProcAddress(hKCModule, "KC_GetFunctionList");
	lib_funcList(&kc_funcs);
	int err = kc_funcs->KC_Init();

	const char* alias = "";
	const char* password = "";
	const char* container;
	const char *tsaurl = "http://tsp.pki.gov.kz:80";
	const char* container_for_CMS = "example/test_CMS_GOST.txt";
	const char* container_for_test_XML = "example/test_xml.txt";;
	const char* container_for_signWSSE = "example/test_wsse.txt";
	const char* container_for_CRL = "example/nca_gost.crl";


	kc_funcs->KC_TSASetUrl((char*)tsaurl);


	int inSignId = 1, number;
	char outCertInternal[CERT_LENGTH];
	char* inData; 
	int dlk, dll;
	inData = (char *)calloc(2048, sizeof(char));

	unsigned char *outSign1;
	outSign1 = (unsigned char *)calloc(50000, sizeof(unsigned char));

	unsigned char  *outSign2;
	outSign2 = (unsigned char *)calloc(50000, sizeof(unsigned char));

	unsigned char *inHashData1;
	inHashData1 = (unsigned char *)calloc(2048, sizeof(unsigned char));

	unsigned char *outXMLSign1;
	outXMLSign1 = (unsigned char *)calloc(50000, sizeof(unsigned char));

	unsigned char *outWSSESign1;
	outWSSESign1 = (unsigned char *)calloc(50000, sizeof(unsigned char));
	unsigned long flags_sign;
	int Rep_Cert = 32;
	int NumberStorage = 0;
	do {
		if (Rep_Cert == 32)
		{
			Rep_Cert = 0;

			
			unsigned long storage;
			printf("____________________________________________________________________\n");

			printf("\nВыберите тип хранилища:\n\t1) Персональный компьютер \t2) Удостоверение личности \n\t3) KAZTOKEN \t4) ETOKEN72 \t5) JACARTA \n\t6) a-KEY \t7) eToken5110 \t8) SSL-сертификат\n");
			scanf("%d", &NumberStorage);
			printf("____________________________________________________________________\n");

			if (NumberStorage == 1)
			{
				container = "GOSTKNCA.p12";
				password = "Qwerty12";
				storage = KCST_PKCS12;

				int containerLen = strlen(container);

				alias = "";
				int passwordLen = strlen(password);
				rv = kc_funcs->KC_LoadKeyStore(storage, (char*)password, passwordLen, (char*)container, containerLen, (char*)alias);

				int errLen = LENGHT;
				char err_str[LENGHT];
				rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
				if (rv > 0){ printf("Error: %x:\n%s\n", rv, err_str); }
			}
			else if (NumberStorage >= 2 && NumberStorage <= 7)
			{
				if (NumberStorage == 2) storage = KCST_KZIDCARD;
				else if (NumberStorage == 3) { storage = KCST_KAZTOKEN; password = "123456789"; }
				else if (NumberStorage == 4) { storage = KCST_ETOKEN72K; password = "1234567890"; }
				else if (NumberStorage == 5) { storage = KCST_JACARTA; password = "1234567890"; }
				else if (NumberStorage == 6) { storage = KCST_AKEY; password = "12345678"; }
				else if (NumberStorage == 7) { storage = KCST_ETOKEN5110; password = "1234567890"; }


				char Tokens[8192];
				unsigned long tokenCount = 0;
				rv = kc_funcs->KC_GetTokens(storage, Tokens, &tokenCount);

				int errLen1 = LENGHT;
				char err_str1[LENGHT];
				rv = kc_funcs->KC_GetLastErrorString(&err_str1[0], &errLen1);
				if (rv > 0){ printf("Error: %x:\n%s", rv, err_str1); }

				if (tokenCount == 0)
				{
					printf("\n\n\tНет подключенных устройств!\n\t\tОшибка!\n\n");
					return 0;
				}

				else
				{
					int TokensLen = strlen(Tokens);
					int passwordLen = strlen(password);
					rv = kc_funcs->KC_LoadKeyStore(storage, (char*)password, passwordLen, Tokens, TokensLen, (char*)alias);
					if (rv > 0){ printf("Error: %x:\n", rv); }

					char Certs[4096];
					unsigned long Count = 40;

					rv = kc_funcs->KC_GetCertificatesList(Certs, &Count);

					char certAliasesArray[10][100];
					int i = 0, k = 1, j = 0, NumberSert;
					if (Count > 0)
					{
						do{
							if (Certs[i] == ';' || !Certs[i])
							{
								int f = 0;
								for (int t = j; t <= i; t++)
								{
									certAliasesArray[k][f] = Certs[t];
									f++;
								}
								k++; j = i + 1;
							}
							i++;
						} while (Certs[i - 1]);


						printf("\tВыберите сертификат:\n");

						for (i = 1; i < k; i++)
							printf("\t\t%d) %s\n", i, certAliasesArray[i]);
						scanf("%d", &NumberSert);
						printf("\n%s\n", certAliasesArray[NumberSert]);
						alias = certAliasesArray[NumberSert];
					}
					else
					{
						printf("\tНа носителе нет сертификатов!\n\n");
						return 0;
					}
				}
			}
			else if (NumberStorage == 8)
			{
				const char* container_for_certificate = "primer/test_gost.cer";
				storage = KC_CERT_USER;
				rv = kc_funcs->X509LoadCertificateFromFile((char*)container_for_certificate, storage);
				if (rv > 0){ printf("Error: %x:\n", rv); }
			}
			else
			{
				return 0;
			}
		}
		printf(" Показать сертификат - 1 \tИнформация о сертификате - 2 \n Подписать данные - 3 \t\tПроверить данные - 4 \n Хэшировать данные - 5 \t\tПодписать хэш-данные - 6 \n Подписать XML - 7 \t\tПроверить XML - 8 \n Подписать WSSE - 9 \t\tПроверить WSSE - 10 \n Получить сертификат из CMS -11\tПолучить сертификат из XML - 12 \n Получить время подписи - 13 \tПроверка сертификата - 14 \n Подписать файл - 15   \t\tПодпись/Проверка множественной подписи - 16 \n Подписать архив - 17 \t\tПроверить подписанный архив - 18\n Выход - 0\t\t\tСмена хранилища сертификатов - 100\n\n");
		printf("Введите номер: ");
		scanf("%d", &number);
		switch (number) {
		case 1: //Показать сертификат
		{
			printf("\n_____________________________________________________________________\n\n");
			unsigned long kalkanFlags = 0x1;

			int outCertLenInternal = CERT_LENGTH;

			rv = kc_funcs->X509ExportCertificateFromStore((char*)alias, kalkanFlags, outCertInternal, &outCertLenInternal);

			if (rv > 0){ printf("Error: %x\n", rv); }
			else{ printf("%s\n", outCertInternal); }
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 2: //Информация о сертификате
		{
			printf("\n_____________________________________________________________________\n\n");
			char* inCert = outCertInternal;
			int inCertLength = strlen(inCert);
			int OutDataLength = DATA_LENGHT;
			unsigned char OutData[DATA_LENGHT];


			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_ISSUER_COUNTRYNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("ISSUER\n%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_ISSUER_SOPN, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_ISSUER_LOCALITYNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_ISSUER_ORG_NAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			kc_funcs->X509CertificateGetInfo(inCert, inCertLength, (int)KC_CERTPROP_ISSUER_ORGUNIT_NAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_ISSUER_COMMONNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_COUNTRYNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("\nSubject\n%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_SOPN, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_LOCALITYNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_COMMONNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_GIVENNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_SURNAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_SERIALNUMBER, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_EMAIL, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_ORG_NAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_ORGUNIT_NAME, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_BC, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJECT_DC, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_NOTBEFORE, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_NOTAFTER, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_KEY_USAGE, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_EXT_KEY_USAGE, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_AUTH_KEY_ID, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SUBJ_KEY_ID, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_CERT_SN, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			rv = kc_funcs->X509CertificateGetInfo(inCert, inCertLength, KC_CERTPROP_SIGNATURE_ALG, &OutData[0], &OutDataLength);
			if (rv == 0)	{ printf("%s\n", OutData); OutDataLength = 2048; }
			else{ printf("\n"); OutDataLength = 2048; }

			printf("\n_____________________________________________________________________\n\n");
			break;

		}
		case 3: //Подписать данные
		{
			printf("\n_____________________________________________________________________\n\n");

			memset(outSign1, 0, strlen((const char*)outSign1));

			printf("\t\tВыберите тип подписи: \n\n\t1) CMS-подпись. Без метки времени\n\t2) CMS-подпись. С меткой времени\n\t3) Сырая подпись (DraftSign)\n\t4) Данные хранятся отдельно\n\t5) Подпись данных в формате BASE64\n");

			int N;
			scanf("%d", &N);

			if (N == 1)
			{
				flags_sign = KC_SIGN_CMS | KC_IN_PEM | KC_OUT_PEM;
			}
			else if (N == 2)
			{
				flags_sign = KC_SIGN_CMS | KC_IN_PEM | KC_OUT_PEM | KC_WITH_TIMESTAMP;
			}
			else if (N == 3)
			{
				flags_sign = KC_SIGN_DRAFT | KC_IN_PEM | KC_OUT_BASE64 | KC_IN2_BASE64;
			}
			else if (N == 4)
			{
				flags_sign = KC_SIGN_CMS | KC_IN_PEM | KC_OUT_PEM | KC_DETACHED_DATA;
			}
			else if (N == 5)
			{
				flags_sign = KC_SIGN_CMS | KC_IN_BASE64 | KC_OUT_BASE64;
			}
			else{
				printf("\n\t\tНет такой команды!\n");
				break;
			}
			

			inData = "Hello World";
			int inDataLength = strlen((const char*)inData);
			int outSignLength = 50000 + 2 * inDataLength;

			int inSignLength = 50000 + 2 * inDataLength;
			unsigned char *outSign, *inSign;

			outSign = (unsigned char *)calloc(outSignLength, sizeof(char));
			inSign = (unsigned char *)calloc(inSignLength, sizeof(char));

			rv = kc_funcs->SignData((char*)alias, flags_sign, inData, inDataLength, inSign, inSignLength, outSign, &outSignLength);
			int errLen = DATA_LENGHT;
			char err_str[DATA_LENGHT];
			rv = kc_funcs->KC_GetLastErrorString(err_str, &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else{ printf("\n%s\n", outSign); }
			for (int j = 0; j < outSignLength; j++)
			{
				outSign1[j] = outSign[j];
			}
			if (outSign)
			{
				free(outSign);
			}
			if (inSign)
			{
				free(inSign);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 4: //Проверить данные
		{
			printf("\n_____________________________________________________________________\n\n");
			alias = "";

			char* VerifyInData = inData;
			int VerifyInDataLength = strlen((const char*)VerifyInData);
			int outSignLength = strlen((const char*)outSign1);

			int OutVerifyDataLength = 4092, OutVerifyInfoLength = 2048, OutVerifyCertLength = 4092, tmpoutErrorStringLen = 4092;
			if (flags_sign == 582)
				OutVerifyDataLength = 0;
			else
				OutVerifyDataLength = 28000;

			char *OutVerifyData, *OutVerifyInfo, *OutVerifyCert;
			OutVerifyData = (char *)calloc(OutVerifyDataLength, sizeof(char));
			OutVerifyInfo = (char *)calloc(OutVerifyInfoLength, sizeof(char));
			OutVerifyCert = (char *)calloc(OutVerifyCertLength, sizeof(char));

			kc_funcs->VerifyData((char *)alias, flags_sign, VerifyInData, VerifyInDataLength, outSign1, outSignLength, OutVerifyData, &OutVerifyDataLength, OutVerifyInfo, &OutVerifyInfoLength, 0, OutVerifyCert, &OutVerifyCertLength);
			char err_str[65535];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &tmpoutErrorStringLen);
			if (rv>0){ printf("Error: %x\n%s\n\n", rv, err_str); }
			else {
				OutVerifyData[OutVerifyDataLength] = '\0';
				printf("%s%s\n\n%s\n", OutVerifyCert, OutVerifyInfo, OutVerifyData);
			}
			if (OutVerifyData)
			{
				OutVerifyData = NULL;
			}
			if (OutVerifyInfo)
			{
				free(OutVerifyInfo);
			}
			if (OutVerifyCert)
			{
				free(OutVerifyCert);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 5: //Хэшировать данные
		{
			printf("\n_____________________________________________________________________\n\n");
			unsigned long kalkanFlagsHash;
			char inHashData[2048] = "";

			int N;
			printf("\n\tВыберите тип хэширования: \n\t\t1) Хэшировать файл \n\t\t2) Хэшировать введенные данные\n");
			scanf("%d", &N);
			if (N == 1)
			{
				kalkanFlagsHash = 34818;
				const char* file = "example/text.txt";
				for (int i = 0; i<strlen(file); i++)
				{
					inHashData[i] = file[i];
				}
			}
			else if (N == 2)
			{
				printf("Введите данные для хэширования: \n");
				scanf("%[^\n]s", inHashData);
				kalkanFlagsHash = 2054;
			}
			else{
				printf("\n\t\tНет такой команды!\n");
				break;
			}
			const char* hash_alias = "sha256";

			int inHashDataLength = strlen(inHashData);
			int outHashDataLength = 10000 + 2 * inHashDataLength;
			unsigned char *outHashData;
			outHashData = (unsigned char *)calloc(outHashDataLength, sizeof(char));

			rv = kc_funcs->HashData((char *)hash_alias, kalkanFlagsHash, inHashData, inHashDataLength, outHashData, &outHashDataLength);
			int i = 0;
			do
			{
				inHashData1[i] = outHashData[i];
				i++;
			} while (i < outHashDataLength);
			if (rv>0){ printf("Error: %x\n", rv); }
			else{ printf("\n%s\n", inHashData1); }
			if (outHashData)
			{
				free(outHashData);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 6: //Подписать хэш-данные
		{
			printf("\n_____________________________________________________________________\n\n");
			const char* hash_alias = "sha256";
			unsigned long flags = 530;
			int inHashDataLength = strlen((const char*)inHashData1);
			int outSignHashDataLength = inHashDataLength * 2 + 50000;
			unsigned char *outSignHashData;
			outSignHashData = (unsigned char *)calloc(outSignHashDataLength, sizeof(char));

			rv = kc_funcs->SignHash((char *)hash_alias, flags, (char*)inHashData1, inHashDataLength, &outSignHashData[0], &outSignHashDataLength);
			outSignHashData[outSignHashDataLength] = '\0';
			if (rv>0){ printf("Error: %x:\n\n", rv); }
			else { printf("%s\n", outSignHashData); }
			if (outSignHashData)
			{
				free(outSignHashData);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		
		case 7: //Подписать XML
		{
			printf("\n_____________________________________________________________________\n\n");
			alias = "";
			const char *signNodeId = "";
			const char *parentNameSpace = "";
			const char *parentSignNode = "";

			char inXMLData[2048] = "";
			int  i = 0;
			FILE *k;
			fopen_s(&k, container_for_test_XML, "r");
			char s[256];
			while ((fgets(s, 256, k)) != NULL){
				strcat_s(inXMLData, s);
			}
			fclose(k);
			int inXMLDataLength = strlen(inXMLData);
			int outXMLSignLength = 50000 + inXMLDataLength;

			unsigned char *outXMLSign;
			outXMLSign = (unsigned char *)calloc(outXMLSignLength, sizeof(char));

			int flags_xml, N = 0;
			printf("Выберите действие: \n\t1 - XML со штампом времени \n\t2 - XML без штампа времени \n");
			scanf("%d", &N);
			if (N == 1){
				flags_xml = KC_WITH_TIMESTAMP;
			}
			else if (N == 2){
				flags_xml = 0;
			}
			rv = kc_funcs->SignXML((char *)alias, flags_xml, inXMLData, inXMLDataLength, &outXMLSign[0], &outXMLSignLength, (char *)signNodeId, (char *)parentSignNode, (char *)parentNameSpace);
			int errLen = LENGHT;	char err_str[LENGHT];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x:\n %s\n", rv, err_str); }
			kc_funcs->KC_XMLFinalize();
			printf("\n%s\n", outXMLSign);
			if (outXMLSign1 != outXMLSign)
			{
				for (int j = 0; j < outXMLSignLength; j++)
				{
					outXMLSign1[j] = outXMLSign[j];
				}
			}
			if (outXMLSign)
			{
				free(outXMLSign);
			}

			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 8: //Проверить XML
		{
			printf("\n_____________________________________________________________________\n\n");

			alias = "";
			int outVerifyInfoLen = DATA_LENGHT;
			char outVerifyInfo[DATA_LENGHT];
			char inXMLSign[CERT_LENGTH]; int inXMLSignLength;
			inXMLSignLength = strlen((const char*)outXMLSign1);

			if (inXMLSignLength != 0)
			{
				for (int t = 0; t<inXMLSignLength; t++){
					inXMLSign[t] = outXMLSign1[t];
				}
				inXMLSign[inXMLSignLength] = '\0';
			}
			else
			{
				printf("\n\tNet podpisannoy XML\n\n");
				break;
			}
			rv = kc_funcs->VerifyXML((char *)alias, 0, inXMLSign, inXMLSignLength, &outVerifyInfo[0], &outVerifyInfoLen);
			int errLen1 = LENGHT; char err_str1[LENGHT];
			rv = kc_funcs->KC_GetLastErrorString(&err_str1[0], &errLen1);
			if (rv>0){ printf("\nVerifyXML error: %x:\n%s\n", rv, err_str1); }
			else{ printf("\n%s\n", outVerifyInfo); }



			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 9: //Подписать WSSE-документ
		{
			printf("\n_____________________________________________________________________\n\n");

			const char* signNodeId_WSSE = "x509cert00";

			int inDataWSSELength = LENGHT; char inDataWSSE[LENGHT];

			FILE *k1;
			fopen_s(&k1, container_for_signWSSE, "r");
			char s1[64];
			while ((fgets(s1, 64, k1)) != NULL){
				strcat_s(inDataWSSE, s1);
			}
			fclose(k1);
			inDataWSSELength = strlen((const char*)inDataWSSE);

			int outSignWSSELenght = LENGHT;
			unsigned char outSignWSSE[LENGHT];
			rv = kc_funcs->SignWSSE((char *)alias, 0, inDataWSSE, inDataWSSELength, outSignWSSE, &outSignWSSELenght, (char *)signNodeId_WSSE);
			int errLen = LENGHT;
			char err_str[LENGHT];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x\n%s\n\n", rv, err_str); }
			else { printf("%s\n", outSignWSSE); }
			kc_funcs->KC_XMLFinalize();
			for (int j = 0; j < outSignWSSELenght; j++)
			{
				outWSSESign1[j] = outSignWSSE[j];
			}


			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 10: //Проверить подписанный WSSE-документ
		{
			printf("\n_____________________________________________________________________\n\n");

			int inWSSESignLength = 35535; 
			char inWSSESign[LENGHT_STAND];
			inWSSESignLength = strlen((const char*)outWSSESign1);
			if (inWSSESignLength != 0)
			{
				for (int t = 0; t<inWSSESignLength; t++){
					inWSSESign[t] = outWSSESign1[t];
				}
				inWSSESign[inWSSESignLength] = '\0';
			}
			else
			{
				printf("\n\tNet podpisannoy WSSE\n\n");
				break;
			}

			char outVerifyInfo[CERT_LENGTH];
			int outVerifyInfoLen = CERT_LENGTH;
			rv = kc_funcs->VerifyXML((char *)alias, 0, inWSSESign, inWSSESignLength, &outVerifyInfo[0], &outVerifyInfoLen);
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("\nVerifyWSSE error: %x:\n%s\n", rv, err_str); }
			else{ printf("\n%s\n", outVerifyInfo); }

			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 11: //Получить сертификат из CMS
		{
			printf("\n_____________________________________________________________________\n\n");
			unsigned long flags = 518;
			int  i = 0, c;
			char inCMS[CERT_LENGTH];
			FILE *k;
			fopen_s(&k, container_for_CMS, "r");
			while ((c = fgetc(k)) != EOF){
				inCMS[i] = c; i++;
			}
			fclose(k);
			int inCMSLength = strlen((const char*)inCMS);

			int outCertFromCMSLength = CERT_LENGTH;
			char outCertFromCMS[CERT_LENGTH];
			rv = kc_funcs->KC_GetCertFromCMS(inCMS, inCMSLength, inSignId, flags, outCertFromCMS, &outCertFromCMSLength);
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else{ printf("%s\n", outCertFromCMS); }
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 12: //Получить сертификат из XML
		{
			printf("\n_____________________________________________________________________\n\n");
			char inXMLSign[CERT_LENGTH]; int inXMLSignLength;
			inXMLSignLength = strlen((const char*)outXMLSign1);

			if (inXMLSignLength != 0)
			{
				for (int t = 0; t<inXMLSignLength; t++){
					inXMLSign[t] = outXMLSign1[t];
				}
				inXMLSign[inXMLSignLength] = '\0';
			}
			else
			{
				printf("\n\tNet podpisannoy XML\n\n");
				break;
			}
			int outCertFromXMLLength = 32768;
			char *outCertFromXML;
			outCertFromXML = (char *)calloc(CERT_LENGTH, sizeof(char));

			rv = kc_funcs->KC_getCertFromXML((const char*)inXMLSign, inXMLSignLength, inSignId, outCertFromXML, &outCertFromXMLLength);
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0)
			{ 
				printf("Library Init error: %x:\n%s\n", rv, err_str); 
			}
			else
			{
				printf("%s\n", outCertFromXML); 
			}
			if (outCertFromXML)
			{
				free(outCertFromXML);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 13: //Получить время подписи
		{
			printf("\n_____________________________________________________________________\n\n");

			time_t OutDateTime;
			unsigned long flags = 774;
			char inData[CERT_LENGTH];

			int c, i = 0;
			FILE *k;
			fopen_s(&k, container_for_CMS, "r");
			while ((c = fgetc(k)) != EOF){
				inData[i] = putchar(c); i++;
			}
			fclose(k);
			int inDataLength = strlen((const char*)inData);
			int outSignLength = strlen((const char*)outSign1);

			rv = kc_funcs->KC_GetTimeFromSig((char*)outSign1, outSignLength, flags, 0, &OutDateTime);

			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else
			{
				struct tm *tm_ptr = NULL;
				localtime_s(tm_ptr, &OutDateTime);
				printf("\nВремя подписи: %02d.%02d.%04d %02d:%02d:%02d\n", tm_ptr->tm_mday, tm_ptr->tm_mon + 1, tm_ptr->tm_year + 1900, tm_ptr->tm_hour, tm_ptr->tm_min, tm_ptr->tm_sec);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 14: //Проверка сертификата
		{
			printf("\n_____________________________________________________________________\n\n");

			unsigned long flags;
			int N;
			char *validPath = NULL;
			printf("Выберите тип проверки: \n\t1)http://ocsp.pki.gov.kz/ \n\t2)CRL\n");
			scanf("%d", &N);
			if (N == 1){
				flags = KC_USE_OCSP;
				validPath = "http://ocsp.pki.gov.kz/";
			}
			else if (N == 2){
				flags = KC_USE_CRL;
				validPath = (char *)container_for_CRL;
			}
			int outInfoLen = 8192;
			char outInfo[LENGHT_STAND];
			char *inCert = outCertInternal;;

			int inCertLength = strlen((const char*)inCert);

			rv = kc_funcs->X509ValidateCertificate(inCert, inCertLength, flags, (char*)validPath, 0, outInfo, &outInfoLen);

			for (int i1 = 0; i1 < outInfoLen - 1; i1++)
			{
				if (outInfo[i1] == '\r')
				{
					if (outInfo[i1 + 1] != '\n')
						outInfo[i1] = '\n';
				}
			}
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(err_str, &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else
			{
				printf("%s\n", outInfo);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 15: //Подписать файл
		{
			printf("\n_____________________________________________________________________\n\n");
			FILE *fp;
			char inDataBytes[1000];
			if (fopen_s(&fp,container_for_test_XML, "rb"))
				printf("Cannot open file.\n");
			memset(outSign1, 0, strlen((const char *)outSign1));

			fread(inDataBytes, sizeof(unsigned char), 1000, fp);
			fclose(fp);

			int kalkanFlags = 518;
			int inDataLength = strlen((const char*)inDataBytes);
			int outSignLength = 50000 + 2 * inDataLength;

			unsigned char *outSign;
			outSign = (unsigned char *)calloc(outSignLength, sizeof(unsigned char));


			int inSignLength = 50000;

			unsigned char *inSign;
			inSign = (unsigned char *)calloc(inSignLength, sizeof(unsigned char));


			rv = kc_funcs->SignData((char*)alias, kalkanFlags, inDataBytes, inDataLength, inSign, inSignLength, outSign, &outSignLength);
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else{ printf("\n%s\n", outSign); }
			for (int j = 0; j < outSignLength; j++)
			{
				outSign1[j] = outSign[j];
			}

			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 16: //Подпись/Проверка множественной подписи.
		{
			printf("\n_____________________________________________________________________\n\n");
			alias = "";
			flags_sign = 582;
			memset(outSign1, 0, strlen((const char *)outSign1));
			sprintf_s(inData,sizeof(inData), "Hello World");

			int inDataLength = strlen((const char*)inData);
			int outSignLength = LENGHT + 2 * inDataLength;
			unsigned char *outSign;
			outSign = (unsigned char *)calloc(outSignLength, sizeof(unsigned char));

			int inSignLength = LENGHT;
			unsigned char inSign[LENGHT];

			FILE *k;
			fopen_s(&k, "example/CMS_for_double_sign.txt", "r");

			char s1[2];
			while ((fgets(s1, 2, k)) != NULL){
				strcat_s((char *)inSign,sizeof(inSign), s1);
			}
			fclose(k);
			inSignLength = sizeof inSign;


			rv = kc_funcs->SignData((char*)alias, flags_sign, (char*)inData, inDataLength, inSign, inSignLength, outSign, &outSignLength);
			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
			if (rv>0){ printf("Error: %x:\n%s\n", rv, err_str); }
			else{ printf("\n%s\n", outSign); }
			for (int j = 0; j < outSignLength; j++)
			{
				outSign1[j] = outSign[j];
			}

			int OutVerifyDataLength = LENGHT, OutVerifyInfoLength = LENGHT, OutVerifyCertLength = LENGHT, tmpoutErrorStringLen = LENGHT_STAND;
			char OutVerifyData[LENGHT];
			char OutVerifyInfo[LENGHT];
			char OutVerifyCert[LENGHT];

			kc_funcs->VerifyData((char *)alias, flags_sign, (char*)inData, inDataLength, outSign, outSignLength, OutVerifyData, &OutVerifyDataLength, OutVerifyInfo, &OutVerifyInfoLength, 0, OutVerifyCert, &OutVerifyCertLength);
			char err_str1[LENGHT_STAND];

			rv = kc_funcs->KC_GetLastErrorString(&err_str1[0], &tmpoutErrorStringLen);
			if (rv>0){ printf("Error: %x\n%s\n\n", rv, err_str1); }
			else
			{
				OutVerifyData[OutVerifyDataLength] = '\0';
				printf("%s%s\n\n%s\n", OutVerifyCert, OutVerifyInfo, OutVerifyData);
			}
			if (outSign)
			{
				free(outSign);
			}
			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 17: //Подписать архив
		{
			printf("\n_____________________________________________________________________\n\n");

			int flags = 0;
			const char *create_dir = "example";

			const char* filePath = NULL;
			const char* name = NULL;

			printf("\t\tВыберите тип подписи: \n\n\t1) Подписать ZIP-aрхив (множественная подпись)\n\t2) Подписать файлы в папке\n\t3) Подписать выделенные файлы\n");
			int N;
			scanf("%d", &N);
			if (N == 1){
				filePath = "example/sign15.zip|";
				name = "multiply";
			}
			else if (N == 2){
				filePath = "example/sign";
				name = "sign15";
			}
			else if (N == 3){
				filePath = "example/sign/1.txt|example/sign/KalkanCryptCOM.docx|example/sign/3.txt|";
				name = "sign15";
			}
			rv = kc_funcs->ZipConSign((char*)alias, filePath, name, create_dir, flags);
			if (rv > 0)
			{
				int errLen = LENGHT_STAND;
				char err_str[LENGHT_STAND];
				rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);
				printf("Error: %x\n%s\n\n", rv, err_str);
			}
			else
			{
				printf("Signature successful\n");
			}


			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 18: //Проверить подписанный архив
		{
			printf("\n_____________________________________________________________________\n\n");

			unsigned long flags = 0;
			const char* filePath = "example\\sign15.zip";

			// const char* filePath = "primer/sign_multiply_triple.zip";
			int outInfoLenght = LENGHT_STAND;
			char outInfo[LENGHT_STAND];

			kc_funcs->ZipConVerify((char*)filePath, flags, outInfo, &outInfoLenght);

			int errLen = LENGHT_STAND;
			char err_str[LENGHT_STAND];
			rv = kc_funcs->KC_GetLastErrorString(&err_str[0], &errLen);

			if (rv>0){ printf("Error: %x\n%s\n\n", rv, err_str); }
			else { printf("%s\n", outInfo); }


			printf("\n_____________________________________________________________________\n\n");
			break;
		}
		case 0: //Выход
		{
			printf("Выход!\n");

			break;
		}
		default:
		{
			printf("\n\nНеверная команда! Попоробуйте еще раз\n\n\n");
			break;
		}
		case 100: //Смена хранилища сертификатов
		{
			printf("Смена ключа!\n");
			Rep_Cert = 32;
			break;

		}
		}
	} while (number != 0);

	if (inData)
	{
		inData = NULL;
		free(inData);
	}
	if (outSign1)
	{
		outSign1 = NULL;
		free(outSign1);
	}

	FreeLibrary(hKCModule);

	return 0;

}