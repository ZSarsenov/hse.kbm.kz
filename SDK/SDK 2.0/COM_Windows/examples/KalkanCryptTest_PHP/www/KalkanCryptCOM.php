<?php header('Content-Type:text/html charset = utf-8' );

$PHP_LIB = new COM('KalkanCryptCOMLib.KalkanCryptCOM');
$PHP_LIB->Init();

$type_store = $_POST['type_store'];
$inputData = $_POST['inputData'];
$outputData = $_POST['outputData'];
$textBOX1 = $_POST['textBOX1'];
$textBOX2 = $_POST['textBOX2'];
$pinCODE = $_POST['pinCODE']; 
$keyStore = $_FILES['keyStore'];
$infoIden = $_POST['infoIden'];
$file11 = $_FILES['file11'];

$in2Base64 = $_POST['in2Base64']; 
$VDraftSign = $_POST['VDraftSign'];
$detachedSign = $_POST['detachedSign'];
$addTimeStamp = $_POST['addTimeStamp'];
$CLS = $_POST['CLS'];
$ocspText = $_POST['keyPathOCSP']; 
$CRLText = $_FILES['keyPathCRL']; 

$signID =  $_POST['signID']; 

$proxyAddr = $_POST['adres_form1']; 
$proxyPort = $_POST['port_form1'];
$proxyUName =$_POST['login_form1'];
$proxyUPass = $_POST['pass_form1'];
$checkBox1 = $_POST['proxy_server_form1'];
$with_proxy = $_POST['with_proxy'];

$outCert = ' ';
$tokens = ' ';
$tokenCount = 0;


$click_store = $_POST['alias_num'];

include 'book/kalkanFlagsconstants.php';

if($with_proxy == "1" )
{
	$flags = $KC_PROXY_ON;
	if ($checkBox1=="1")
	{
	    $flags += $KC_PROXY_AUTH;
	}
	$PHP_LIB->SetProxy($flags, $proxyAddr, $proxyPort, $proxyUName, $proxyUPass);
}


if($type_store !="Не выбрано")
{
	if( $type_store == "Файловая система - PKCS#12 (*.p12)")
  {
    $storage = $KCST_PKCS12; 
    $alias = 'sha256';
    $PHP_LIB->LoadKeyStore($storage, $pinCODE, $_FILES['keyStore']['tmp_name'],'test');
    $PHP_LIB->X509ExportCertificateFromStore($alias, $kalkanFlags, $outCert);
  }
  
  elseif ( $type_store == "Сертификат PEM (*.cer, *.crt, *.pem)")
  {
    $storage = $KC_CERT_USER; 
    $alias = 'sha256';
    $PHP_LIB->X509LoadCertificateFromFile($_FILES['keyStore']['tmp_name'], $storage);
    $PHP_LIB->X509ExportCertificateFromStore($alias, $kalkanFlags, $outCert);
  }
  else
  {
    if ( $type_store == "Удостоверение личности гражданина РК (KZIDCard)") { $storage = $KCST_KZIDCARD; }
    elseif ( $type_store == "Kaztoken") { $storage = $KCST_KAZTOKEN; }
    elseif ( $type_store == "eToken72K") { $storage = $KCST_ETOKEN72K; }
    elseif ( $type_store == "JaCarta") { $storage = $KCST_JACARTA; }

    $PHP_LIB->GetTokens($storage, $tokens, $tokenCount);
    if($tokenCount == 0)
      {echo "Ошибка! \n Нет подключенных устройств";}
    else 
    {
      $PHP_LIB->LoadKeyStore($storage, $pinCODE,$tokens, ' ');

      $certAliasesString = "";
      $certCount = 0;
      $PHP_LIB->GetCertAliases($certAliasesString, $certCount);
      
      if( $certCount> 0)
      { 
        if($click_store == "1")
        {
          $alias = $_POST['alias'];
          $PHP_LIB->X509ExportCertificateFromStore($alias, $kalkanFlags, $outCert);
        }
        else
        {
          echo $certAliasesString;
        }
      }
      
    }
  }
}


    if($infoIden == "Показать сертификат")
    {
      echo $outCert;
    }

    elseif($infoIden == "Информация о сертификате")
  	{
      header('Content-Type:text/html; charset=windows-1251');
      $outData = "";
     echo "ISSUER"."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_COUNTRYNAME, $outData); 
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_SOPN, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_LOCALITYNAME, $outData);
     echo  "$outData"."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_ORG_NAME, $outData);
     echo  $outData."\n";

     $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_ORGUNIT_NAME, $outData);
     echo  $outData."\n";


      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_ISSUER_COMMONNAME, $outData);
     echo  $outData."\n\n"."SUBJECT\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_COUNTRYNAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_SOPN, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_LOCALITYNAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_COMMONNAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_GIVENNAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_SURNAME, $outData);
     echo  $outData."\n";

       $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_SERIALNUMBER, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_EMAIL, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_ORG_NAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_ORGUNIT_NAME, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_BC, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJECT_DC, $outData);
     echo  $outData."\n\n";


      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_NOTBEFORE, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_NOTAFTER, $outData);
     echo  $outData."\n";

       $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_KEY_USAGE, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_EXT_KEY_USAGE, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_AUTH_KEY_ID, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SUBJ_KEY_ID, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_CERT_SN, $outData);
     echo  $outData."\n";

      $PHP_LIB->X509CertificateGetInfo($outCert, $KC_CERTPROP_SIGNATURE_ALG, $outData);
     echo  $outData."\n";
    }
    elseif($infoIden == "Подписать данные")
    {
      $outSign = ""; 
      $PHP_LIB-> SignData($alias, $kalkanFlags, $textBOX1, $outSign);
      echo $outSign;
    }
    elseif($infoIden == "Проверить данные")
    {
      $inData = $textBOX1;
      $inSign = $textBOX2;
      $outData = " ";
      $outVerifyInfo = " ";
      $outCert = " ";
      $PHP_LIB->VerifyData(" ", $kalkanFlags, 0, $inData, $inSign,  $outData,  $outVerifyInfo,  $outCert);
      echo $outVerifyInfo."\n\n".$outData; 
    }
    elseif($infoIden == "Хэшировать данные")
    {
      $outData = "";
      $PHP_LIB->HashData("sha256", $kalkanFlags, $textBOX1,  $outData);
      echo $outData;
    }
    elseif($infoIden == "Подписать хэш-данные")
    {
      $outData = "";
      $inHash = $textBOX2;
      if($inputData == "In Base64")
      {
          $ascii = ""; $i = 0;
          for ($i = 0; $i < strlen($textBOX2); $i += 2)
          {
              $hs = substr($textBOX2, $i,2);
              $decval = base_convert($hs, 16, 32);
              $character ="$decval";
              $ascii += $character;
          }
          $inHash = $ascii;
      }
      $PHP_LIB->SignHash($alias, $kalkanFlags, $inHash ,  $outData);
      echo $outData;
    }
    elseif($infoIden == "Получить время подписи")
    {
      header('charset=windows-1251');
      $inData = $textBOX2;
      $datetime = new Variant(0, VT_I4 | VT_BYREF); 
      $PHP_LIB->TSAGetTimeFromSig($inData, $kalkanFlags, 0, $datetime);
      var_dump($datetime);
    }
    elseif($infoIden == "Подписать XML")
    {
      header('Content-Type:text/html; charset=utf-8');
      $signNodeId = "";
      $parentSignNode = "";
      $parentNameSpace = "";
      $inData = $textBOX1;
      $outSign = "";
      /*$err = 0x0;
      $errStr = "";
      $PHP_LIB->GetLastErrorString($errStr, $err);*/
        $PHP_LIB->SignXML($alias, 0, $signNodeId, $parentSignNode, $parentNameSpace, $inData, $outSign);
        echo $outSign;
        $PHP_LIB->XMLFinalize();
    }
     elseif($infoIden == "Проверить XML")
    {
        $outVerifyInfo = "";
        $PHP_LIB-> VerifyXML("", 0, $textBOX2, $outVerifyInfo);
        echo $outVerifyInfo;
    }
    elseif($infoIden == "Получить сертификат из XML")
    {
      $outCert = "";
        $PHP_LIB->GetCertFromXML($textBOX2, (int)$signID, $outCert);
        echo  $outCert;
    }
    elseif($infoIden == "Получить сертификат из CMS")
    {
       $outCert = "";
        $PHP_LIB->GetCertFromCMS($textBOX2, $kalkanFlags, $signID, $outCert);
        echo  $outCert;
    }
 	  elseif($infoIden == "Проверка сертификата")
    {
      $outInfo = "";
      $inCert = $textBOX1;
      $validType = 0;
      $validPath = "";
      $tmpD =  date('Y-m-d H:i:s', '0001-01-01 00:00:00');

        if($CLS == "OCSP URL")
        {
          $validType = $KC_USE_OCSP;
          $validPath = $ocspText;
        }
        elseif($CLS == "CRL")
        {
          $validType = $KC_USE_CRL;
          $validPath = $_FILES['keyPathCRL']['tmp_name'];
        }

        $PHP_LIB -> X509ValidateCertificate($inCert, $validType, $validPath, $tmpD,  $outInfo);
        echo  $outInfo;
    }
    elseif($infoIden == "Подписать файл")
    {
      $inData = "";
      $tmpData = "";
      $outSign = "";
      $inData = $_FILES['file11']['tmp_name'];
      $PHP_LIB->SignData("", $kalkanFlags, $inData, $outSign);
      echo $outSign;
    }
    elseif($infoIden == "Проверить файл")
    {
      echo "string";
      $inData = "";
      $outCert= ""; 
      $outData= "";
      $outVerifyInfo = "";
      $inSign = $textBOX2;
      $inData = $_FILES['file11']['tmp_name'];
      $PHP_LIB->VerifyData("", $kalkanFlags, 0, $inData, $inSign, $outData, $outVerifyInfo,$outCert);
      echo $outVerifyInfo."\nrrrrrrrrrrrrrr\n".$outData;
    }
    
    elseif($infoIden == "Сохранить")
    {
      $proxyAddr = $addr; 
      $proxyPort = $port; 
      $proxyUName = $login; 
      $proxyUPass = $tb_pass;
        
    }
?>
