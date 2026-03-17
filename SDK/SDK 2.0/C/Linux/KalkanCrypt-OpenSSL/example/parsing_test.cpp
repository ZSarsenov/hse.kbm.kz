extern "C" {

#include <ctime>
#include <cstring>
#include <openssl/conf.h>
#include <openssl/evp.h>
#include <openssl/err.h>
#include <openssl/pkcs12.h>
#include <openssl/engine.h>
#include <openssl/ssl.h>
#include <openssl/ocsp.h>
#include <openssl/bio.h>
#include <openssl/pem.h>
#include "openssl/x509.h"
#include <internal/engine.h>

}

#define CERT_LENGTH 32768
#define TMP_CERTBUFSIZE 32768

int str_index(unsigned char *s, unsigned long sLen, unsigned char *t, unsigned long tLen)
{
	unsigned int i, j, k;

	for (i = 0; i<sLen; i++) {
		for (j = i, k = 0; k<tLen && s[j] == t[k]; j++, k++)
			;
		if (k>0 && k == tLen)
			return i;
	}
	return -1;
}


int main()
{
	printf("Start!\n");

	const char *pass = "";
	const char* fileName;

	fileName = "/home/d/cert_gost2015/key/legal_chief_08b10ee2395a07ce65113d07a0759339141ea5f0.p12";
	pass = "123456";

	FILE *fp12;
	PKCS12 *p12;
	EVP_PKEY *pkey;
	X509 *cert;

	STACK_OF(X509) *ca = NULL;
	cert = X509_new();
	pkey = EVP_PKEY_new();

	ENGINE_load_openssl();
	engine_load_gost();
	ENGINE_load_builtin_engines();
	ENGINE_register_all_complete();
	ERR_load_BIO_strings();
	OpenSSL_add_all_algorithms();
	ENGINE_register_all_pkey_asn1_meths();
	ERR_load_crypto_strings();

	printf("Process ...\n");

	fp12 = fopen((char*)fileName, "rb");
	if (!fp12) {
		/* Ошибка открытия файла ключа */
		printf("open file error\n");
		return 0;
	}

	p12 = d2i_PKCS12_fp(fp12, NULL);
	if (!p12) {
		/* Ошибка чтения файла ключа */
		printf("read file error\n");
		return 0;
	}

	if (!PKCS12_parse(p12, (char*) pass, &pkey, &cert, &ca)) {
		/* Ошибка парсинга файла ключа */
		printf("parsing error\n");
		return 0;
	}

	fclose(fp12);
	PKCS12_free(p12);


	printf("End!\n\n\n");


/* -------- convert to printable format -----------*/

	unsigned long rv = 0, indx = 0, indx1 = 0;
	int tmpCertLen = TMP_CERTBUFSIZE;
	int tmp_derLen = TMP_CERTBUFSIZE;
	unsigned char *tmpCert = NULL, *tmp_der = NULL;
	BIO *outbuf = BIO_new(BIO_s_mem());
	X509 *tmp_cert = NULL;

	char outCert[CERT_LENGTH];
	int outCertLength = CERT_LENGTH;

	tmpCert = (unsigned char*)calloc(TMP_CERTBUFSIZE, sizeof(unsigned char));
	tmp_der = (unsigned char*)calloc(TMP_CERTBUFSIZE, sizeof(unsigned char));

	rv = PEM_write_bio_X509(outbuf, cert);
	tmpCertLen = BIO_read(outbuf, tmpCert, tmpCertLen);
	tmpCert[tmpCertLen] = '\0';
	indx = str_index(tmpCert, tmpCertLen, (unsigned char *)"-----", 5);

	indx = str_index(tmpCert + indx + 5, tmpCertLen - indx - 5, (unsigned char *)"-----", 5);
	indx += 11;
	indx1 = str_index(tmpCert + indx, tmpCertLen - indx, (unsigned char *)"-----", 5);
	indx1 += (indx - 1);
	tmpCertLen = indx1 - indx;

	if (outCertLength >= tmpCertLen) {
		memcpy(outCert, &tmpCert[indx], tmpCertLen);
		outCert[tmpCertLen] = '\0';
		outCertLength = tmpCertLen;
	}
	else {
		outCertLength = tmpCertLen;
		if (outbuf) {
			BIO_free(outbuf);
			outbuf = NULL;
		}
	rv = 2;
	}

/* ------------------------------------------------*/



	printf("Base64-encoded certificate:\n%s\n", outCert);

}
