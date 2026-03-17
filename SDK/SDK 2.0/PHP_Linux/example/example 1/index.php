<?php
include "kalkanFlags&constants.php";

KalkanCrypt_Init();
$flag_proxy = $KC_PROXY_AUTH;
$inProxyAddr = "192.168.39.241";
$inProxyPort = "9090";
$inUser = ""; 
$inPass = "";
$err = KalkanCrypt_SetProxy( $flag_proxy, $inProxyAddr, $inProxyPort, $inUser, $inPass);
$tsaurl = "http://test.pki.gov.kz/tsp/";


KalkanCrypt_TSASetUrl($tsaurl);

$container = "/home/d/GOSTKNCA_69c23f6ee06a17a537efb90b647d47ff2a396030.p12";


$password = "Qwerty12";
$alias = "";
$storage = $KCST_PKCS12;
$err = KalkanCrypt_LoadKeyStore($storage, $password,$container,$alias);
if ($err > 0){	echo "Error:\tKalkanCrypt_LoadKeyStore".$err."\n";} 
else{echo "Ok\tKalkanCrypt_LoadKeyStore\n";}

$fd = fopen("/home/d/output.txt", 'w') or die("не удалось создать файл");
$granica = "\n\n___________________________________________________________________________\n\n";


	          






//Показать сертификат

	$outCert = "";
	$err = KalkanCrypt_X509ExportCertificateFromStore($alias,0, $outCert);
	if ($err > 0){	echo "Error:\tKalkanCrypt_X509ExportCertificateFromStore".$err."\n";} 
	else{echo "Ok\tKalkanCrypt_X509ExportCertificateFromStore\n";fwrite($fd,$granica.$outCert.$granica);}

//Информация о сертификате
	
	$OutData = "";
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_COUNTRYNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){ echo "Error:\tX509CertificateGetInfo = ".$err."\n"; }}
	else{fwrite($fd,"ISSUER\n".$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORG_NAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_LOCALITYNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORG_NAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORGUNIT_NAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_COMMONNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_COUNTRYNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,"\nSubject\n".$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SOPN,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_LOCALITYNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_COMMONNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_GIVENNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SURNAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SERIALNUMBER,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_EMAIL,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_ORG_NAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_ORGUNIT_NAME,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_BC,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_DC,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_NOTBEFORE,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_NOTAFTER,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_KEY_USAGE,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_EXT_KEY_USAGE,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_AUTH_KEY_ID,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJ_KEY_ID,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}

	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_CERT_SN,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");}
	
	$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SIGNATURE_ALG,$outCert, $OutData);
	if ($err > 0){if ($err != 149946424){echo "Error:\tX509CertificateGetInfo = ".$err."\n";}}
	else{fwrite($fd,$OutData."\n");echo "Ok\tKalkanCrypt_X509CertificateGetInfo\n";fwrite($fd,$granica);}

///Подписать данные 	Проверить Данные 	Получить сертификат из CMS
	$err_sign = 0; $err_verify = 0; $err_getcert = 0; $err_getTimeFromCMS = 0;
	for($flags_number = 1; $flags_number < 9; $flags_number++)
 	{
 		$outSign = "";
 		$inData = "Hello World";
	 	
 		if($flags_number == 1) //CMS-подпись в формате PEM. Без метки времени(Данные - просто текст)
 		{
 			$flags_sign = $KC_SIGN_CMS + $KC_OUT_PEM;
 			$flags_verify = $KC_SIGN_CMS + $KC_IN_PEM + $KC_OUT_PEM;
 		}
		elseif($flags_number == 2) //CMS-подпись в формате PEM. С меткой времени
 		{
 			$flags_sign = $KC_SIGN_CMS + $KC_OUT_PEM + $KC_WITH_TIMESTAMP;
 			$flags_verify = $KC_SIGN_CMS + $KC_IN_PEM + $KC_OUT_PEM ;
 		}
 		elseif($flags_number == 3) //Сырая подпись данных (DraftSign) в BASE64(Данные - просто текст)
 		{
 			$flags_sign = $KC_SIGN_DRAFT + $KC_OUT_BASE64;
 			$flags_verify = $KC_SIGN_DRAFT + $KC_IN_BASE64 + $KC_IN_PEM ;
 		}
 		elseif($flags_number == 4) //Сырая подпись данных (DraftSign) в BASE64(Данные в BASE64) 
 		{
 			$inData = "SGVsbG8gV29ybGQ=";
 			$flags_sign = $KC_SIGN_DRAFT + $KC_OUT_BASE64 + $KC_IN_BASE64;
 			$flags_verify = $KC_SIGN_DRAFT + $KC_IN2_BASE64 + $KC_IN_BASE64;
 		}
 		elseif($flags_number == 5) //CMS-detached в формате PEM(Данные-текст. хранятся отдельно)
 		{
 			$flags_sign = $KC_SIGN_CMS + $KC_OUT_PEM + $KC_DETACHED_DATA;
 			$flags_verify = $KC_SIGN_CMS + $KC_IN_PEM + $KC_OUT_PEM + $KC_DETACHED_DATA;
 		}
 		elseif($flags_number == 6) //CMS-detached в формате BASE64(Данные-BASE64 хранятся отдельно)
 		{
 			$inData = "SGVsbG8gV29ybGQ=";
 			$flags_sign = $KC_SIGN_CMS + $KC_IN_BASE64 + $KC_OUT_BASE64 + $KC_DETACHED_DATA;
 			$flags_verify = $KC_SIGN_CMS + $KC_IN_BASE64 + $KC_IN2_BASE64 + $KC_OUT_BASE64 + $KC_DETACHED_DATA;
 		}
 		elseif($flags_number == 7) //Мультиподпись в формате PEM
 		{
 			$flags_sign = $KC_SIGN_CMS + $KC_IN_PEM + $KC_OUT_PEM + $KC_DETACHED_DATA + $KC_NOCHECKCERTTIME;
 			$myfile = fopen("/home/d/file/CMS_for_double_sign.txt", "r") or die("Unable to open file!");
			$outSign= fread($myfile,filesize("/home/d/file/CMS_for_double_sign.txt")); fclose($myfile);

			$flags_verify = $KC_SIGN_CMS + $KC_IN_PEM + $KC_OUT_PEM + $KC_DETACHED_DATA + $KC_NOCHECKCERTTIME;
 		}
 		elseif($flags_number == 8) //Подписать pdf-файлa в формате BASE64
 		{
 			$inData = "/home/d/file/application.pdf";
 			$flags_sign = $KC_SIGN_CMS + $KC_IN_FILE + $KC_OUT_BASE64 ;
 		}

		$err = KalkanCrypt_SignData($alias, $flags_sign, $inData, $outSign);

		if ($err > 0){echo "Error:\tKalkanCrypt_SignData ".$flags_number." = ".$err."\n"; $err_sign = 1; fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else{fwrite($fd,$outSign.$granica); }
		$flag_getCertFromCMS = $flags_verify;
		
	//Проверить данные
	
 		if($flags_number == 8)
 		{
 			$outSign = "/home/d/file/signPDF_in_base64";
 			$flags_verify = $KC_SIGN_CMS + $KC_IN_BASE64 + $KC_IN_FILE + $KC_OUT_BASE64 + $KC_NOCHECKCERTTIME;
 			$flag_getCertFromCMS = $flags_sign;
 		}

		$outData  = "";	$outVerifyInfo  = ""; $outCertCMS  = "";
		$err = KalkanCrypt_VerifyData($alias, $flags_verify, $inData, 0, $outSign, $outData,	$outVerifyInfo,	$outCertCMS);
		if ($err > 0){echo "Error:\tKalkanCrypt_VerifyData ".$flags_number." = ".$err."\n"; $err_verify = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else{fwrite($fd,$outVerifyInfo."\n\n".$outData.$granica); }

	//Получить сертификат из CMS
		if($flags_number != 3 && $flags_number != 4)
		{
			$outCertCMS = "";
			$err = KalkanCrypt_getCertFromCMS($outSign, 1, $flag_getCertFromCMS, $outCertCMS);
			if ($err > 0){echo "Error:\tKalkanCrypt_getCertFromCMS ".$flags_number." = ".$err."\n"; $err_getcert = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,$outCertCMS.$granica); }
		}	

	//Получить время подписи
			
		$OutDateTime = 0;
		if($flags_number == 2 )
		{
			$err = KalkanCrypt_GetTimeFromSig($outSign,0, $flags_verify, $OutDateTime);
			if ($err > 0){echo "Error:\tKalkanCrypt_GetTimeFromSig ".$flags_number." = ".$err."\n"; $err_getTimeFromCMS = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{
				$OutDateTime = $OutDateTime + 6*3600;
				$time = date('d.m.Y  H:i:s',$OutDateTime);
				fwrite($fd,"Время подписи: ".$time." по времени Нур-Султана".$granica); 
			}
		}
	}

	if($err_sign != 1 ) {echo "Ok\tKalkanCrypt_SignData\n";}
	if($err_verify != 1){echo "Ok\tKalkanCrypt_VerifyData\n";}
	if($err_getcert != 1){echo "Ok\tKalkanCrypt_getCertFromCMS\n";}
	if($err_getTimeFromCMS != 1){echo "Ok\tKalkanCrypt_GetTimeFromSig\n";}

//Хэшировать данные
	$inData = "Privet";
	$err_hash = 0;
	for($int_num = 0; $int_num<5; $int_num++)
	{	
		switch ($int_num) {
			case '0':
			{
				$alias_hash = "sha256";
				$flags_hash = $KC_OUT_BASE64;
				$hashData  = "";
				$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
				if ($err > 0){echo "Error:\tKalkanCrypt_HashData ".$int_num." = ".$err."\n"; $err_hash = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
				else{fwrite($fd,$hashData.$granica); }
				break;
			}
			case '1':
			{
				$alias_hash = "";
				$flags_hash = $KC_OUT_BASE64 + $KC_HASH_SHA256;
				$hashData  = "";
				$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
				if ($err > 0){echo "Error:\tKalkanCrypt_HashData ".$int_num." = ".$err."\n"; $err_hash = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
				else{fwrite($fd,$hashData.$granica); }
				break;
			}
			case '2':
			{
				$alias_hash = "";
				$flags_hash = $KC_OUT_BASE64 + $KC_HASH_GOST95;
				$hashData  = "";
				$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
				if ($err > 0){echo "Error:\tKalkanCrypt_HashData ".$int_num." = ".$err."\n"; $err_hash = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
				else{fwrite($fd,$hashData.$granica); }
				break;
			}
			case '3':
			{
				$alias_hash = "Gost34311_95";
				$flags_hash = $KC_OUT_BASE64 ;
				$hashData  = "";
				$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
				if ($err > 0){echo "Error:\tKalkanCrypt_HashData ".$int_num." = ".$err."\n"; $err_hash = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
				else{fwrite($fd,$hashData.$granica); }
				break;
			}
			case '4':
			{
				$alias_hash = "";
				$flags_hash = $KC_OUT_BASE64 + $KC_HASH_GOST95 + $KC_IN_FILE;
				$inData = "/home/d/file/application.pdf";
				$hashData  = "";
				$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
				if ($err > 0){echo "Error:\tKalkanCrypt_HashData ".$int_num." = ".$err."\n"; $err_hash = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
				else{fwrite($fd,$hashData.$granica); }
				break;
			}

		}
	
		
	}
	if($err_hash != 1){echo "Ok\tKalkanCrypt_HashData\n";}
	
//Подписать хэш-данные
	$flags_hashSign = $KC_SIGN_CMS + $KC_IN_BASE64 + $KC_OUT_PEM;
	$sighHashData  = "";
	$err = KalkanCrypt_SignHash($alias_hash, $flags_hashSign, $hashData,$sighHashData);
	if ($err > 0){echo "Error:\tKalkanCrypt_SignHash ".$int_num." = ".$err."\n"; fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
	else{fwrite($fd,$sighHashData.$granica); echo "Ok\tKalkanCrypt_SignHash\n";}
	
//Подписать/Проверить XML   	Получить сертификат из XML
	$err_SignXml = 0; 	$err_VerifyXml = 0; $err_getCertFromXml = 0; $err_getAlg = 0;

	$inDataXML = 	'<?xml version="1.0" encoding="UTF-8"?>
					<soapenv:Envelope
					        xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
					        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
					        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
					  <soapenv:Header>
					    <ns1:RequestHeader
					         soapenv:actor="http://schemas.xmlsoap.org/soap/actor/next"
					         soapenv:mustUnderstand="0"
					         xmlns:ns1="https://www.google.com/apis/ads/publisher/v201905">
					      <ns1:networkCode id = "11">123456</ns1:networkCode>
					      <ns1:applicationName>DfpApi-Java-2.1.0-dfp_test</ns1:applicationName>
					    </ns1:RequestHeader>
					  </soapenv:Header>
					  <soapenv:Body>
					    <getAdUnitsByStatement xmlns="https://www.google.com/apis/ads/publisher/v201905">
					      <filterStatement>
					        <query>WHERE parentId IS NULL LIMIT 500</query>
					      </filterStatement>
					    </getAdUnitsByStatement>
					  </soapenv:Body>
					</soapenv:Envelope>';
	for($int_num = 0; $int_num<3; $int_num++)
	{	
		switch ($int_num) {
			case '0':
			{
				$alias_xml = "";	$flags_XML = 0;$signNodeId = ""; $parentNameSpace= "";	$parentSignNode= "";
				$err = KalkanCrypt_SignXML($alias_xml, $flags_XML, $inDataXML, $outSignXML,$signNodeId,$parentSignNode,$parentNameSpace);			
				break;
			}
			case '1':
			{
				$alias_xml = "";	$flags_XML = 0;$signNodeId = "11"; $parentNameSpace= "http://schemas.xmlsoap.org/soap/envelope/";	$parentSignNode= "Header";
				$err = KalkanCrypt_SignXML($alias_xml, $flags_XML, $inDataXML, $outSignXML,$signNodeId,$parentSignNode,$parentNameSpace);				
				break;
			}
			case '2':
			{
				$alias_xml = "";	$flags_XML = $KC_WITH_TIMESTAMP; $signNodeId = ""; $parentNameSpace= "";	$parentSignNode= ""; $outSignXML = "";
				$err = KalkanCrypt_SignXML($alias_xml, $flags_XML, $inDataXML, $outSignXML,$signNodeId,$parentSignNode,$parentNameSpace);
				break;
			}
		}
		if ($err > 0){echo "Error:\tKalkanCrypt_SignXML ".$int_num." = ".$err."\n"; $err_SignXml = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else
		{
			fwrite($fd,$outSignXML.$granica); 
			$err = KalkanCrypt_VerifyXML($alias_xml, $flags_XML, $outSignXML, $outVerifyInfo);
			if ($err > 0){echo "Error:\tKalkanCrypt_VerifyXML ".$int_num." = ".$err."\n"; $err_VerifyXml = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,$outVerifyInfo.$granica); }

			$err = KalkanCrypt_getCertFromXML($outSignXML, 0, $outCertXML);
			if ($err > 0){echo "Error:\tKalkanCrypt_getCertFromXML ".$int_num." = ".$err."\n"; $err_getCertFromXml = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,$outCertXML.$granica); }

			$err = KalkanCrypt_getSigAlgFromXML($outSignXML,$outAlg);
			if ($err > 0){echo "Error:\tKalkanCrypt_getSigAlgFromXML ".$int_num." = ".$err."\n"; $err_getAlg = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,$outAlg.$granica); }

			KalkanCrypt_XMLFinalize();

		}		
	}

	if($err_SignXml != 1){echo "Ok\tKalkanCrypt_SignXML\n";}
	if($err_VerifyXml != 1){echo "Ok\tKalkanCrypt_VerifyXML\n";}
	if($err_getCertFromXml != 1){echo "Ok\tKalkanCrypt_getCertFromXML\n";}
	if($err_getAlg != 1){echo "Ok\tKalkanCrypt_getSigAlgFromXML\n";}




//Проверка сертификата
	$err_ValCert = 0;
	for($type_validate = 0; $type_validate < 2; $type_validate ++)
	{	
		$flags_validate = 0; $validPath = "";
		if($type_validate == 0){
			$flags_validate = $KC_USE_OCSP;
	        $validPath = "http://test.pki.gov.kz/ocsp/";
		}
		elseif($type_validate == 1){
        	$flags_validate = $KC_USE_CRL;
        	$validPath = "nca_gost_test_1.crl";
		}
		$outInfo = "";
		$getResp = "";
		$err = KalkanCrypt_X509ValidateCertificate($outCert, $flags_validate, $validPath, 0, $outInfo, $KC_NOCHECKCERTTIME, $getResp);			
		if ($err > 0){echo "Error:\tKalkanCrypt_X509ValidateCertificate ".$type_validate." = ".$err."\n"; $err_ValCert = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else{fwrite($fd,$outInfo.$granica); fwrite($fd,"getResp:\n".$getResp.$granica);}
	}

	if($err_ValCert != 1){echo "Ok\tKalkanCrypt_X509ValidateCertificate\n";}
	


//Подписать/Проверить WSSE-документ	

	$signNodeId_WSSE = "x509cert00";
	$inFile = fopen("/home/d/file/wsse.txt", "r") or die("Unable to open file!");
	$inDataWSSE= fread($inFile,filesize("/home/d/file/wsse.txt"));
	fclose($inFile);
	$err = KalkanCrypt_SignWSSE($alias, 0, $inDataWSSE, $outSignWSSE, $signNodeId_WSSE);
	if ($err > 0){echo "Error:\tKalkanCrypt_SignWSSE = ".$err."\n";}
	else{
		fwrite($fd,$outSignWSSE."\n");echo "Ok\tKalkanCrypt_SignWSSE\n";fwrite($fd,$granica);
		$err = KalkanCrypt_VerifyXML($alias, 0, $outSignWSSE, $outVerifyInfoWSSE);
		if ($err > 0){echo "Error:\tKalkanCrypt_VerifyXML-WSSE = ".$err."\n";	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else{fwrite($fd,$outVerifyInfoWSSE.$granica); echo "Ok\tKalkanCrypt_VerifyXML-WSSE\n";}

		KalkanCrypt_XMLFinalize();
	}



 //Подписать архив
	$outDir = "/home/d/zip"; $err_ZipCreate = 0; $err_ZipVerify = 0;
	$flags = 0; $name = ""; $filePath = "";

	for($int_num = 0; $int_num<=3; $int_num++)
	{	
		switch ($int_num) {
			case '0': //Подписать ZIP-aрхив (множественная подпись)
			{
				$filePath = "/home/d/zip/zip_signed_files2.zip|";
				$name = "zip_multiply10";
				break;
			}
			case '1': //Подписать файлы в папке
			{
				$filePath = "/home/d/file";
				$name = "zip_signed_folder";
				break;
			}
			case '2': //Подписать выделенные файлы
			{
				$filePath = "/home/d/file/wsse.txt|/home/d/file/application.pdf|/home/d/file/signPDF_in_base64|/home/d/file/CMS_for_double_sign.txt|";
		        $name = "zip_signed_files";
				break;
			}
			case '3': //Подписать выделенные файлы WithTimeStamp
			{
				$filePath = "/home/d/file/wsse.txt|";
		        $name = "zip_with_ts";
		        $flags = $KC_WITH_TIMESTAMP;
				break;
			}
		}

		$err = KalkanCrypt_ZipConSign($alias, $filePath, $name,$outDir, $flags); 
		if ($err > 0){echo "Error:\tKalkanCrypt_ZipConSign ".$int_num." = ".$err."\n"; $err_ZipCreate = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
		else{

			$outInfo_verify = "";
			$filePath_verify = "/home/d/zip/".$name.".zip";
            $err = KalkanCrypt_ZipConVerify($filePath_verify, $flags, $outInfo_verify);
            if($err > 0){echo "Error:\tKalkanCrypt_ZipConVerify ".$int_num." = ".$err."\n"; $err_ZipVerify = 1;	fwrite($fd,$outInfo_verify."\n\n\n".KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,$outInfo_verify.$granica); }

			//Получить сертификат из ZIP
			$err = KalkanCrypt_getCertFromZipFile($filePath_verify, $flags, 1, $outCertZip);
			if ($err > 0){echo "Error:\tKalkanCrypt_getCertFromZip ".$int_num." = ".$err."\n"; $err_getcert = 1;	fwrite($fd,KalkanCrypt_GetLastErrorString().$granica); }
			else{fwrite($fd,"outCert:\n".$outCertZip.$granica); }
		}
	}

	if($err_ZipCreate != 1){echo "Ok\tKalkanCrypt_ZipConSign\n";}
	if($err_ZipVerify != 1){echo "Ok\tKalkanCrypt_ZipConVerify\n";}
	if($err_getcert != 1){echo "Ok\tKalkanCrypt_getCertFromZip\n";}






//Загрузить сертификат из файла
	$certPath = "/home/d/RSA256_e3fe35adda3b45cbea3a3f1ed48f263dc55c556e.cer";
    $err = KalkanCrypt_X509LoadCertificateFromFile($KC_CERT_USER, $certPath);
    if($err > 0){echo "Error:\tKalkanCrypt_X509LoadCertificateFromFile = ".$err."\n";fwrite($fd,$outInfo_verify."\n\n\n".KalkanCrypt_GetLastErrorString().$granica); }
	else{echo "Ok\tKalkanCrypt_X509LoadCertificateFromFile\n"; }


fclose($fd);

KalkanCrypt_Finalize();

?>
