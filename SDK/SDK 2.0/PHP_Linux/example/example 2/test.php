<?php
include "kalkanFlags&constants.php";

KalkanCrypt_Init();
$flag_proxy = $KC_PROXY_AUTH;
$inProxyAddr = "192.168.39.241";
$inProxyPort = "9090";
$inUser = ""; 
$inPass = "";
$err = KalkanCrypt_SetProxy( $flag_proxy, $inProxyAddr, $inProxyPort, $inUser, $inPass);
//$tsaurl = "http://test.pki.gov.kz:80//tsp/";
$tsaurl = "http://test.pki.gov.kz/tsp/";
//$tsaurl = "http://tsp.pki.gov.kz:80";
KalkanCrypt_TSASetUrl($tsaurl);

echo "------------------------------------------------------------------\n";
echo "\nВыберите тип хранилища:\n\t1) Персональный компьютер \t2) Удостоверение личности \n\t3) KAZTOKEN \t4) ETOKEN72 \t5) JACARTA \n\t6) a-KEY \t7) eToken5110 \t8) SSL-сертификат\n";
fscanf(STDIN, "%d\n", $typeStorage); 
switch ($typeStorage) {
	case '1':
		$container = "/home/d/RSA256_e3fe35adda3b45cbea3a3f1ed48f263dc55c556e.p12";


		$password = "Qwerty12";
		$alias = "";
		$storage = $KCST_PKCS12;
		KalkanCrypt_LoadKeyStore($storage, $password,$container,$alias);
		echo "Ok\n\n";
		break;
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
		// echo "\tВведите пароль:\t";
		// fscanf(STDIN, "%s\n", $password); 
		if("2" == $typeStorage){
			$storage = $KCST_KZIDCARD;
		}
		elseif("3" == $typeStorage){
			$storage = $KCST_KAZTOKEN;
		}
		elseif("4" == $typeStorage){
			$storage = $KCST_ETOKEN72K;
		}
		elseif("5" == $typeStorage){
			$storage = $KCST_JACARTA;
		}
		elseif("6" == $typeStorage){
			$storage = $KCST_AKEY;
		}
		elseif("7" == $typeStorage){
			$storage = $KCST_ETOKEN5110;
		}
		$password = "12345678";
		$err = KalkanCrypt_GetTokens($storage,$tokens,$tk_count);
		//echo $tokens."\n";

		if ($tk_count == 0){
		    echo "\n\n\tНет подключенных устройств!\n\t\tОшибка!\n\n";
		}
		else{
			$alias = "";
			$err = KalkanCrypt_LoadKeyStore($storage, $password,$tokens,$alias);
			if ($err > 0){
				echo "Error: ".$err."\n";
			}
			//echo "alias: [".$alias."]\n";

			$err = KalkanCrypt_GetCertificatesList($certificates,$count);
			//echo $count;
			//echo "\n"."certificates: ".$certificates."\n";
			for($i = 1; $i <= $count; $i++)
			{
				$certAliasesArray[$i] = "";
			}
			$k = 1; $j = 0;
		    if ($count > 0)
		    {
		    	for($i = 0; $i <= strlen($certificates) ; $i++)	  
		    	{          
		            if (($i == strlen($certificates)) || ($certificates[$i] == ";") )
		            {
		            	for($t = $j; $t < $i; $t++)
		            	{
		            		$certAliasesArray[$k] = $certAliasesArray[$k].$certificates[$t];
		            		//echo "certificates number: ".$t.": ".$certificates[$t]."\n";
		            	}
		            	echo "\t".$k.") [".$certAliasesArray[$k]."]\n";
		            	$k++; $j = $i + 1;
		            }
		    	}
		        echo "Выберите сертификат:\t";
		       	fscanf(STDIN, "%d\n", $NumberSert);
		       	$alias = $certAliasesArray[$NumberSert];
		   	}
		   	else{
		   		echo "\tНа носителе нет сертификатов!\n\n";
		   	}
	   	}
		break;
		case '8':
			$filePath = "/home/d/GOSTKNCA_dc3afa7db0ef0530a04ed53f187f4cb9fabdc1e8.cer" ;
			$err = (KalkanCrypt_X509LoadCertificateFromFile($KC_CERT_USER, $filePath));
			if ($err > 0){
				echo "Error: ".$err."\n";
				exit;
			}
			break;
	default:
		echo "Неверная команда!\n\n\tВыход!\n";
		exit;
		break;
}



$number = 1;
while($number != 0)
{
	echo "___________________________________________________________________________\n";
	echo "\n Показать сертификат - 1 \tИнформация о сертификате - 2 \n Подписать данные - 3 \t\tПроверить данные - 4 \n Хэшировать данные - 5 \t\tПодписать хэш-данные - 6 \n Подписать XML - 7 \t\tПроверить XML - 8 \n Получить сертификат из CMS - 9\tПолучить сертификат из XML - 10 \n Получить время подписи - 11 \tПроверка сертификата - 12  \n Подписать архив - 13 \t\tПроверить подписанный архив - 14  \n Получить сертификат из ZIP - 15 Использовать Proxy - 16 \n Получить алгоритм XML-подписи - 17 Выход - 0 \n\n Введите номер: "; 
	fscanf(STDIN, "%d\n", $number); 
		echo "\n___________________________________________________________________________\n\n";

	
	switch ($number) {
			case 1: //Показать сертификат
		{
			$encoding = 0;
			//$alias = "";
			$outCert = "";
			$err = KalkanCrypt_X509ExportCertificateFromStore($alias,0, $outCert);
			if ($err > 0){
				echo "Error: ".$err."\n";
			}
			else{
				echo $outCert."\n";
			}
			break;
		}

		case 2: //Информация о сертификате
		{
			$OutData = "";
			$inCert = $outCert;
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_COUNTRYNAME,$outCert, $OutData);

			if ($err > 0){if ($err != 149946424){ echo "Error: ".$err."\n"; }}
			else{echo"ISSUER\n".$OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORG_NAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_LOCALITYNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORG_NAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_ORGUNIT_NAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_ISSUER_COMMONNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_COUNTRYNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo"\nSubject\n".$OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SOPN,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_LOCALITYNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_COMMONNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_GIVENNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SURNAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_SERIALNUMBER,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_EMAIL,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_ORG_NAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_ORGUNIT_NAME,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_BC,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJECT_DC,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_NOTBEFORE,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_NOTAFTER,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_KEY_USAGE,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_EXT_KEY_USAGE,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_AUTH_KEY_ID,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SUBJ_KEY_ID,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}

			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_CERT_SN,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			
			$err = KalkanCrypt_X509CertificateGetInfo($KC_CERTPROP_SIGNATURE_ALG,$outCert, $OutData);
			if ($err > 0){if ($err != 149946424){echo "Error: ".$err."\n";}}
			else{echo $OutData."\n";}
			break;
	 	}
	 	case 3: //Подписать данные
	 	{
	 		echo "\tВыберите тип подписи: \n1) CMS-подпись. Без метки времени\n2) CMS-подпись. С меткой времени\n3) Сырая подпись (DraftSign)\n4) Данные хранятся отдельно\n5) Мультиподпись\n";
	 		fscanf(STDIN, "%d\n", $flags_number); 
	 		$inData = "Hello World";
	 		
	 		$outSign = "";
	 		if($flags_number == 1)
	 		{
	 			$flags_sign = 518;
	 		}
			elseif($flags_number == 2)
	 		{
	 			$flags_sign = 774;
	 		}
	 		elseif($flags_number == 3)
	 		{
	 			$flags_sign = 2053;
	 		}
	 		elseif($flags_number == 4)
	 		{
	 			$flags_sign = 582;
	 		}
	 		elseif($flags_number == 5)
	 		{
	 			$flags_sign = 582;
	 			$myfile = fopen("test/CMS_for_double_sign.txt", "r") or die("Unable to open file!");
				$outSign= fread($myfile,filesize("test/CMS_for_double_sign.txt"));
				
	 		}

	 		echo "alias: ".$alias."\n";
	 		//$alias = "";
			$err = KalkanCrypt_SignData($alias, $flags_sign, $inData, $outSign);
			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outSign."\n";
			}
			break;
		}
		case 4: //Проверить данные
	 	{
	 		if($flags_sign == 2053)
	 		{
	 			$flags_sign = 2081;
	 		}

			$outData  = "";
			$outVerifyInfo  = "";
			$outCert  = "";
			$err = KalkanCrypt_VerifyData($alias, $flags_sign, $inData, 0, $outSign, $outData,	$outVerifyInfo,	$outCert);
			
			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outCert.$outVerifyInfo."\n\n".$outData."\n\n";
			}

		break;
		}
		case 5: //Хэшировать данные
		{
			$inData = "Privet";
			$alias_hash = "sha256";
			$flags_hash = 2054;
			$hashData  = "";
			$err = KalkanCrypt_HashData($alias_hash, $flags_hash, $inData, $hashData);
			
			if ($err > 0){
				echo "Error: ".$err."\n";
			}
			else{
				echo $hashData."\n\n";
			}
			break;
		}
		case 6: //Подписать хэш-данные
		{
			$flags_hashSign = 530;
			$sighHashData  = "";

			$err = KalkanCrypt_SignHash($alias_hash, $flags_hashSign, $hashData,$sighHashData);

			if ($err > 0){
				echo "Error: ".$err."\n";
			}
			else{
				echo $sighHashData."\n";
			}
			break;
		}

		 case 7: //Подписать XML
    {
      $alias_xml = "";
      $flags_XML = 0;
      //$signNodeId = ""; $parentSignNode = ""; $parentNameSpace = "";
      $signNodeId = "11";
      $parentSignNode = "Header";
      $parentNameSpace = "http://schemas.xmlsoap.org/soap/envelope/";

      $inDataXML = "<?xml version='1.0' encoding='UTF-8'?>
<soapenv:Envelope
        xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
        xmlns:xsd='http://www.w3.org/2001/XMLSchema'
        xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>
  <soapenv:Header>
    <ns1:RequestHeader
         soapenv:actor='http://schemas.xmlsoap.org/soap/actor/next'
         soapenv:mustUnderstand='0'
         xmlns:ns1='https://www.google.com/apis/ads/publisher/v201905'>
      <ns1:networkCode id = '11'>123456</ns1:networkCode>
      <ns1:applicationName>DfpApi-Java-2.1.0-dfp_test</ns1:applicationName>
    </ns1:RequestHeader>
  </soapenv:Header>
  <soapenv:Body>
    <getAdUnitsByStatement xmlns='https://www.google.com/apis/ads/publisher/v201905'>
      <filterStatement>
        <query>WHERE parentId IS NULL LIMIT 500</query>
      </filterStatement>
    </getAdUnitsByStatement>
  </soapenv:Body>
</soapenv:Envelope>";

      $err = KalkanCrypt_SignXML($alias_xml, $flags_XML, $inDataXML, $outSignXML, $signNodeId, $parentSignNode, $parentNameSpace);
      if ($err > 0){
        echo "Error: ".$err."\n";
        print_r(KalkanCrypt_GetLastErrorString());
      }
      else{
        echo $outSignXML;
      }
      break;
    }

		case 8: //Проверить XML
	 	{

			$err = KalkanCrypt_VerifyXML($alias_xml, $flags_XML, $outSignXML, $outVerifyInfo);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outVerifyInfo."\n";
			}
			break;
		}
		case 9: //Получить сертификат из CMS
			{
			$inSignID = 1;
			$err = KalkanCrypt_getCertFromCMS($outSign, $inSignID, $flags_sign, $outCert);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outCert."\n";
			}
				break;
			}
		case 10: //Получить сертификат из XML
			{
			$inSignID = 1;
			$err = KalkanCrypt_getCertFromXML($outSignXML, $inSignID, $outCert);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outCert."\n";
			}
				break;
			}
		case 11: //Получить время подписи
		{
			$flags = 774;
			$OutDateTime = 0;
			$err = KalkanCrypt_GetTimeFromSig(  $outSign,0, $flags, $OutDateTime);
			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				$OutDateTime = $OutDateTime + 3600*6;
				$time = date('d.m.Y  H:i:s',$OutDateTime);
				print_r( "\nВремя подписи: ".$time." по времени Нур-Султана \n");
			}

			break;
	
		}
		case 12: //Проверка сертификата
		{
			echo ("Выберите тип проверки: \n\t1)http://ocsp.pki.gov.kz/ \n\t2)CRL\n");
			$container_for_CRL = "/home/d/nca_gost_test.crl";
			fscanf(STDIN, "%d\n", $type_validate); 				
			if($type_validate == 1){
				$flags_validate = $KC_USE_OCSP;
		        $validPath = "http://test.pki.gov.kz/ocsp/";
			}
			elseif($type_validate == 2){
	        	$flags_validate = $KC_USE_CRL;
	        	$validPath = $container_for_CRL;
			}
			$outInfo = "";
			$getResp = "";
			$err = KalkanCrypt_X509ValidateCertificate($outCert, $flags_validate, $validPath, 0, $outInfo, $KC_NOCHECKCERTTIME, $getResp);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo "\n\n\n".$outInfo."\n";
				echo "\n".$getResp."\n";
			}
			break;
		}


		

		case 13: //Подписать архив
	 	{

	 		$outDir = "/home/d/zip";
	 		$name = "";
			printf("\t\tВыберите тип подписи: \n\n\t1) Подписать ZIP-aрхив (множественная подпись)\n\t2) Подписать файлы в папке\n\t3) Подписать выделенные файлы\n");
			fscanf(STDIN, "%d\n", $N); 
			$flags = 0;
			if($N==1){
				$filePath = "/home/d/zip/zip_signed_files2.zip|";
				$name = "sign15";
			}
			elseif($N==2){
				$filePath = "/home/d/file";
				$name = "sign15";
			}
			elseif($N==3){
	        	$filePath = "/home/d/file/wsse.txt|/home/d/file/application.pdf|/home/d/file/signPDF_in_base64|/home/d/file/CMS_for_double_sign.txt|";
	        	$name = "sign15";
			}
			$err = KalkanCrypt_ZipConSign($alias, $filePath,$name,$outDir, $flags); 
		

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo "Signature successful\n";
			}
			break;
		}
		case 14: //Проверить подписанный архив
	 	{
	 		$flags = 0;
			$filePath_verify = "/home/d/zip/sign15.zip";
			$outInfo = "";
            $err = KalkanCrypt_ZipConVerify($filePath_verify, $flags, $outInfo);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outInfo."\n";
			}
			break;
		}
		case 15: //Получить сертификат из ZIP
		{
			$flags = 0;
			$filePath_verify = "/home/d/zip/sign15.zip";
			$outCertZip = "";
			$err = KalkanCrypt_getCertFromZipFile($filePath_verify , $flags, 1, $outCertZip);

			if ($err > 0){
				echo "Error: ".$err."\n";
				print_r(KalkanCrypt_GetLastErrorString());
			}
			else{
				echo $outCertZip."\n";
			}
				break;
		}
		case 16: //Использовать Proxy
		{
			$flag_proxy = $KC_PROXY_AUTH;
			$inProxyAddr = "192.168.39.241";
			$inProxyPort = "9090";
			$inUser = ""; 
			$inPass = "";
			$err = KalkanCrypt_SetProxy( $flag_proxy, $inProxyAddr, $inProxyPort, $inUser, $inPass);
			if ($err > 0){
				echo "Error: ".$err."\n";
			}
		
			break;
		}
		case 17: //Получить алгоритм XML-подписи
		{
			$sigAlg = "";
			if($outSignXML){
				$err = KalkanCrypt_getSigAlgFromXML( $outSignXML, $sigAlg);
				if ($err > 0){
					echo "Error: ".$err."\n";
					print_r(KalkanCrypt_GetLastErrorString());
				}
				else{echo $sigAlg."\n";}
			}
			else{echo "\n\tНет подписанной XML\n\n";}
			
			
		
			break;
		}
		

}
}

KalkanCrypt_Finalize();

?>
