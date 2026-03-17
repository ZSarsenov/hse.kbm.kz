unit KalkanCryptCOM_TLB;

// ************************************************************************ //
// WARNING                                                                    
// -------                                                                    
// The types declared in this file were generated from data read from a       
// Type Library. If this type library is explicitly or indirectly (via        
// another type library referring to this type library) re-imported, or the   
// 'Refresh' command of the Type Library Editor activated while editing the   
// Type Library, the contents of this file will be regenerated and all        
// manual modifications will be lost.                                         
// ************************************************************************ //

// ************************************************************************  //
// Type Lib: KalkanCryptCOM.dll (1)
// LIBID: {A7B16770-A0B5-4AAE-9FA4-267521C7B038}
// LCID: 0
// Helpfile: 
// HelpString: KalkanCryptCOM Library
// DepndLst: 
//   (1) v2.0 stdole, (C:\Windows\SysWOW64\stdole2.tlb)
// SYS_KIND: SYS_WIN32
// ************************************************************************ //
{$TYPEDADDRESS OFF} // Unit must be compiled without type-checked pointers.
{$WARN SYMBOL_PLATFORM OFF}
{$WRITEABLECONST ON}
{$VARPROPSETTER ON}
{$ALIGN Off}

interface

uses Winapi.Windows, System.Classes, System.Variants, System.Win.StdVCL, Vcl.Graphics, Vcl.OleServer, Winapi.ActiveX;
  

// *********************************************************************//
// GUIDS declared in the TypeLibrary. Following prefixes are used:        
//   Type Libraries     : LIBID_xxxx                                      
//   CoClasses          : CLASS_xxxx                                      
//   DISPInterfaces     : DIID_xxxx                                       
//   Non-DISP interfaces: IID_xxxx                                        
// *********************************************************************//
const
  // TypeLibrary Major and minor versions
  KalkanCryptCOMMajorVersion = 8;
  KalkanCryptCOMMinorVersion = 2;

  LIBID_KalkanCryptCOMLib: TGUID = '{A7B16770-A0B5-4AAE-9FA4-267521C7B038}';

  IID_IKalkanCryptCOM: TGUID = '{B541AE08-C6D8-4B27-8566-06FD75585250}';
  CLASS_KalkanCryptCOM: TGUID = '{0F1065E7-5D87-4693-BE33-E42A299D685A}';

// *********************************************************************//
// Declaration of Enumerations defined in Type Library                    
// *********************************************************************//

type
  KALKANCRYPTCOM_STORETYPE = TOleEnum;
const
  KCST_PKCS12 = 	  $00000001;
  KCST_KZIDCARD = 	$00000002;
  KCST_KAZTOKEN = 	$00000004;
  KCST_ETOKEN72K = 	$00000008;
  KCST_JACARTA = 	  $00000010;
  KCST_X509CERT = 	$00000020;
  KCST_AKEY =       $00000040;

type
  KALKANCRYPTCOM_CERTTYPE = TOleEnum;
const
  KC_CERT_CA =            $00000201;
  KC_CERT_INTERMEDIATE =  $00000202;
  KC_CERT_USER =          $00000204;

type
  KALKANCRYPTCOM_CERTCODETYPE = TOleEnum;
const
  KC_CERT_DER = $00000101;
  KC_CERT_PEM = $00000102;
  KC_CERT_B64 = $00000104;

type
  KALKANCRYPTCOM_VALIDTYPE = TOleEnum;
const
  KC_USE_NOTHING = 	$00000401;
  KC_USE_CRL = 		  $00000402;
  KC_USE_OCSP = 	  $00000404;

type
  KALKANCRYPTCOM_CERTPROPID = TOleEnum;
const
  KC_CERTPROP_ISSUER_COUNTRYNAME =    $00000801;
  KC_CERTPROP_ISSUER_SOPN		 =        $00000802;
  KC_CERTPROP_ISSUER_LOCALITYNAME =   $00000803;
  KC_CERTPROP_ISSUER_ORG_NAME	 =      $00000804;
  KC_CERTPROP_ISSUER_ORGUNIT_NAME =   $00000805;
  KC_CERTPROP_ISSUER_COMMONNAME =     $00000806;
  KC_CERTPROP_SUBJECT_COUNTRYNAME =   $00000807;
  KC_CERTPROP_SUBJECT_SOPN	 =        $00000808;
  KC_CERTPROP_SUBJECT_LOCALITYNAME =  $00000809;
  KC_CERTPROP_SUBJECT_COMMONNAME =    $0000080a;
  KC_CERTPROP_SUBJECT_GIVENNAME =     $0000080b;
  KC_CERTPROP_SUBJECT_SURNAME	 =      $0000080c;
  KC_CERTPROP_SUBJECT_SERIALNUMBER =  $0000080d;
  KC_CERTPROP_SUBJECT_EMAIL	 =        $0000080e;
  KC_CERTPROP_SUBJECT_ORG_NAME =      $0000080f;
  KC_CERTPROP_SUBJECT_ORGUNIT_NAME =  $00000810;
  KC_CERTPROP_SUBJECT_BC		 =        $00000811;
  KC_CERTPROP_SUBJECT_DC		 =        $00000812;
  KC_CERTPROP_NOTBEFORE		 =          $00000813;
  KC_CERTPROP_NOTAFTER		 =          $00000814;
  KC_CERTPROP_KEY_USAGE		 =          $00000815;
  KC_CERTPROP_EXT_KEY_USAGE	 =        $00000816;
  KC_CERTPROP_AUTH_KEY_ID		 =        $00000817;
  KC_CERTPROP_SUBJ_KEY_ID		 =        $00000818;
  KC_CERTPROP_CERT_SN			 =          $00000819;
  KC_CERTPROP_ISSUER_DN		 =          $0000081a;
  KC_CERTPROP_SUBJECT_DN		 =        $0000081b;
  KC_CERTPROP_SIGNATURE_ALG	 =        $0000081c;
  KC_CERTPROP_PUBKEY  =               $0000081d;
  KC_CERTPROP_OCSP =                  $0000081f;
  KC_CERTPROP_GET_CRL =               $00000820;
  KC_CERTPROP_GET_DELTA_CRL =         $00000821;



type
  KALKANCRYPTCOM_XMLPARAMS = TOleEnum;
const
  KC_XML_INCL_C14N =			    $01000001;
  KC_XML_INCL_C14NCOMMENT =	  $01000002;
  KC_XML_INCL_C14N11 =			  $01000004;
  KC_XML_INCL_C14N11COMMENT = $01000008;
  KC_XML_EXCL_C14N =    			$01000010;
  KC_XML_EXCL_C14NCOMMENT =		$01000020;


type
  KALKANCRYPTCOM_FLAGS = TOleEnum;
const
  KC_SIGN_DRAFT =     $00000001;
  KC_SIGN_CMS	 =      $00000002;
  KC_IN_PEM	 =        $00000004;
  KC_IN_DER	 =        $00000008;
  KC_IN_BASE64 =      $00000010;
  KC_IN2_BASE64 =     $00000020;
  KC_DETACHED_DATA =  $00000040;
  KC_WITH_CERT =      $00000080;
  KC_WITH_TIMESTAMP = $00000100;
  KC_OUT_PEM	 =      $00000200;
  KC_OUT_DER	 =      $00000400;
  KC_OUT_BASE64 =     $00000800;
  KC_PROXY_OFF =      $00001000;
  KC_PROXY_ON =       $00002000;
	KC_PROXY_AUTH =     $00004000;
  KC_IN_FILE =        $00008000;
  KC_HASH_SHA256 =    $00020000;
  KC_HASH_GOST95 =    $00040000;
  KC_NOCHECKCERTTIME= $00010000;
  KC_GET_OCSP_RESPONSE=$00080000;


type
  KALKANCRYPTCOM_ERRORS = TOleEnum;
const
  KCR_OK =                    $00000000;
  KCR_INIT_ERROR =            $08F00001;
  KCR_ERROR_READ_PKCS12 =     $08F00002;
  KCR_ERROR_OPEN_PKCS12 =     $08F00003;
  KCR_INVALID_PROPID =        $08F00004;
  KCR_BUFFER_TOO_SMALL =      $08F00005;
  KCR_CERT_PARSE_ERROR =      $08F00006;
  KCR_INVALID_FLAG =          $08F00007;
  KCR_OPENFILEERR =           $08F00008;
  KCR_INVALIDPASSWORD =       $08F00009;
  KCR_CERTWRONGDATE =         $08F0000a;
  KCR_CERTEXPIRED =           $08F0000b;
  KCR_ISNOTCACERT =           $08F0000c;
  KCR_MEMORY_ERROR =          $08F0000d;
  KCR_CHECKCHAINERROR =       $08F0000e;
  KCR_CACERTKEYUSAGEERROR =   $08F0000f;
  KCR_VALIDTYPEERROR =        $08F00010;
  KCR_BADCRLFORMAT =          $08F00011;
  KCR_LOADCRLERROR =          $08F00012;
  KCR_LOADCRLSERROR =         $08F00013;
  KCR_UNKNOWN_ALG =           $08F00015;
  KCR_KEYNOTFOUND =           $08F00016;
  KCR_SIGN_INIT_ERROR =       $08F00017;
  KCR_SIGN_ERROR =            $08F00018;
  KCR_ENCODE_ERROR =          $08F00019;
  KCR_INVALID_FLAGS =         $08F0001a;
  KCR_CERTNOTFOUND =          $08F0001b;
  KCR_VERIFYSIGNERROR =       $08F0001c;
  KCR_BASE64_DECODE_ERROR =   $08F0001d;
  KCR_UNKNOWN_CMS_FORMAT =    $08F0001e;
  KCR_GETHASHERROR =          $08F0001f;
  KCR_CA_CERT_NOT_FOUND =     $08F00020;
  KCR_XMLSECINIT_ERROR =      $08F00021;
  KCR_LOADTRUSTEDCERTSERR =   $08F00022;
  KCR_SIGN_INVALID =          $08F00023;
  KCR_NOSIGNFOUND =           $08F00024;
  KCR_DECODE_ERROR =          $08F00025;
  KCR_XMLPARSEERROR =         $08F00026;
  KCR_XMLADDIDERROR =         $08F00027;
  KCR_XMLINTERNALERROR =      $08F00028;
  KCR_XMLSETSIGNERROR =       $08F00029;
  KCR_OPENSSLERROR =          $08F0002a;
  KCR_ENGINE_INITERR =        $08F0002b;
  KCR_NOTOKENFOUND =          $08F0002c;
  KCR_OCSP_ADDCERTERR =       $08F0002d;
  KCR_OCSP_PARSEURLERR =      $08F0002e;
  KCR_OCSP_ADDHOSTERR =       $08F0002f;
  KCR_OCSP_REQERR =           $08F00030;
  KCR_OCSP_CONNECTIONERR =    $08F00031;
  KCR_VERIFY_NODATA =         $08F00032;
  KCR_IDATTR_NOTFOUND =       $08F00033;
  KCR_IDRANGE =               $08F00034;
  KCR_XMLKEYDUPERROR =        $08F00035;
  KCR_XMLKEYCREATEERROR =     $08F00036;
  KCR_READERNOTFOUND =        $08F00037;
  KCR_GETCERTPROPERR =        $08F00038;
  KCR_SIGNFORMMAT =           $08F00039;
  KCR_INDATAFORMAT =          $08F0003a;
  KCR_OUTDATAFORMAT =         $08F0003b;
  KCR_VERIFY_INIT_ERROR =     $08F0003c;
  KCR_VERIFY_ERROR =          $08F0003d;
  KCR_HASH_ERROR =            $08F0003e;
  KCR_SIGNHASH_ERROR =        $08F0003f;
  KCR_CACERTNOTFOUND =        $08F00040;
  KCR_CERTTIMEINVALID =       $08F00042;
  KCR_CONVERTERROR =          $08F00043;


  KCR_LIBRARYNOTINITIALIZED = $08F00101;

  KCR_ENGINELOADERR =         $08F00200;

  KCR_PARAM_ERROR =           $08F00300;

  KCR_CERT_STATUS_OK =        $08F00400;
  KCR_CERT_STATUS_REVOKED	 =  $08F00401;
  KCR_CERT_STATUS_UNKNOWN	 =  $08F00402;



type
// *********************************************************************//
// Forward declaration of types defined in TypeLibrary
// *********************************************************************//
  IKalkanCryptCOM = interface;
//  IKalkanCryptCOMDisp = dispinterface;

// *********************************************************************//
// Declaration of CoClasses defined in Type Library
// (NOTE: Here we map each CoClass to its Default Interface)
// *********************************************************************//
  KalkanCryptCOM = IKalkanCryptCOM;


// *********************************************************************//
// Interface: IKalkanCryptCOM
// Flags:     (4416) Dual OleAutomation Dispatchable
// GUID:      {B541AE08-C6D8-4B27-8566-06FD75585250}
// *********************************************************************//
  IKalkanCryptCOM = interface(IDispatch)
    ['{B541AE08-C6D8-4B27-8566-06FD75585250}']
	  function Init(): HRESULT; stdcall;
    function GetTokens(storage: Integer; var tokens: WideString; var tCount: Integer): HRESULT; stdcall;
	  function GetCertAliases(var certAlias: WideString; var count: Integer): HRESULT; stdcall;
  	function LoadKeyStore(storage: Integer; password: WideString;
                          container: WideString; alias: WideString): HRESULT; stdcall;
    function X509LoadCertificateFromFile(certPath: WideString;
                                         certType: Integer): HRESULT; stdcall;
    function X509LoadCertificateFromBuffer(inCert: WideString; flag: Integer): HRESULT; stdcall;
    function X509ExportCertificateFromStore(alias: WideString; flag: Integer;
                                            var outCert: WideString): HRESULT; stdcall;
    function X509CertificateGetInfo(inCert: WideString; propId: Integer;
                                    var outData: WideString): HRESULT; stdcall;
    function X509ValidateCertificate(inCert: WideString; validType: Integer;
                                     validPath:WideString; checkTime: Int64;
                                     var outInfo: WideString): HRESULT; stdcall;
    function SignData(alias: WideString; flags: Integer; inData: WideString;
                      var outSign: WideString): HRESULT; stdcall;
	  function SignXML(alias: WideString; flags: Integer; signNodeId: WideString;
                     parentSignNode: WideString; parentNameSpace: WideString;
                     inData: WideString; var outSign: WideString): HRESULT; stdcall;
	  function VerifyData(alias: WideString; flags: Integer; inCertID: Integer;
                        inData: WideString; inSign: WideString; var outData: WideString;
                        var outVerifyInfo: WideString; var outCert: WideString): HRESULT; stdcall;
	  function VerifyXML(alias: WideString; flags: Integer; inData: WideString;
                       var outVerifyInfo: WideString): HRESULT; stdcall;
	  function GetLastError(var rv: LongWord): HRESULT; stdcall;
	  function GetLastErrorString(var errorString: WideString; var rv: LongWord): HRESULT; stdcall;
    function GetSigAlgFromXML(xml_in: WideString; var retSigAlg: WideString): HRESULT; stdcall;
    function GetCertFromXML(inXML: WideString; inSignID: Integer; var outCert: WideString): HRESULT; stdcall;
    function XMLFinalize(): HRESULT; stdcall;
    function Finalize(): HRESULT; stdcall;
    function HashData(algorithm: WideString; flags: Integer; inData: WideString; var outData: WideString): HRESULT; stdcall;
    function SignHash(alias: WideString; flags: Integer; inHash: WideString; var outSign: WideString): HRESULT; stdcall;
    function TSASetUrl(tsaUrl: WideString): HRESULT; stdcall;
    function TSAGetTimeFromSig(inData: WideString; flags: Integer; sigId: Integer; var outDateTime: Int64): HRESULT; stdcall;
    function SignDataBytes(alias: WideString; flags: Integer; inData: Byte; inDataLength: Integer; var outSign: WideString): HRESULT; stdcall;
	  function SetProxy(flags: Integer; inProxyAddr: WideString; inPort: WideString; inUserName: WideString; inUserPass: WideString): HRESULT; stdcall;
    function GetCertFromCMS(inCMS: WideString; flags:Integer; inSignID: Integer; var outCert: WideString): HRESULT; stdcall;
    function VerifyDataBytes (alias: WideString; flags: Integer; inCertID: Integer;
                              inData: Byte; inDataLength: Integer; inSign: WideString;
                              var outData: WideString; var outVerifyInfo: WideString;
                              var outCert: WideString): HRESULT; stdcall;
    function SignWSSE(alias: WideString; flags: Integer; inData: WideString; signNodeId: WideString; var outSign: WideString): HRESULT; stdcall;
    function HashDataBytes(algorithm: WideString; flags: Integer; inData: Byte;
                            inDataLength: Integer; out outData: WideString): HRESULT; stdcall;
    function ZipConVerify(inZipFile: WideString; flags: Integer; out outVerifyInfo: WideString): HRESULT; stdcall;
    function ZipConSign(alias: WideString; inFiles: WideString; zipName: WideString; outDir: WideString; flags: Integer): HRESULT; stdcall;
    function GetCertFromZIP(inZipFile: WideString; flags: Integer; inSignID: Integer;
                             out outCert: WideString): HRESULT; stdcall;
  end;

// *********************************************************************//
// DispIntf:  IKalkanCryptCOMDisp
// Flags:     (4416) Dual OleAutomation Dispatchable
// GUID:      {B541AE08-C6D8-4B27-8566-06FD75585250}
// *********************************************************************//
  IKalkanCryptCOMDisp = dispinterface
    ['{B541AE08-C6D8-4B27-8566-06FD75585250}']
    function Init(): HRESULT; dispid 5001;
    function GetTokens(storage: Integer; var tokens: WideString; var tCount: Integer): HRESULT; dispid 5002;
	  function GetCertAliases(var certAlias: WideString; var count: Integer): HRESULT; dispid 5003;
  	function LoadKeyStore(storage: Integer; password: WideString;
                          container: WideString; alias: WideString): HRESULT; dispid 5004;
    function X509LoadCertificateFromFile(certPath: WideString;
                                         certType: Integer): HRESULT; dispid 5005;
    function X509LoadCertificateFromBuffer(inCert: WideString; flag: Integer): HRESULT; dispid 5006;
    function X509ExportCertificateFromStore(alias: WideString; flag: Integer;
                                            var outCert: WideString): HRESULT; dispid 5007;
    function X509CertificateGetInfo(inCert: WideString; propId: Integer;
                                    var outData: WideString): HRESULT; dispid 5008;
    function X509ValidateCertificate(inCert: WideString; validType: Integer;
                                     validPath:WideString; checkTime: Int64;
                                     var outInfo: WideString): HRESULT; dispid 5009;
    function SignData(alias: WideString; flags: Integer; inData: WideString;
                      outSign: WideString): HRESULT; dispid 5010;
	  function SignXML(alias: WideString; flags: Integer; signNodeId: WideString;
                     parentSignNode: WideString; parentNameSpace: WideString;
                     inData: WideString; var outSign: WideString): HRESULT; dispid 5011;
	  function VerifyData(alias: WideString; flags: Integer; inCertID: Integer;
                        inData: WideString; inSign: WideString; var outData:WideString;
                        var outVerifyInfo: WideString; var outCert: WideString): HRESULT; dispid 5012;
	  function VerifyXML(alias: WideString; flags: Integer; inData: WideString;
                       outVerifyInfo: WideString): HRESULT; dispid 5013;
	  function GetLastError(var rv: LongWord): HRESULT; dispid 5014;
	  function GetLastErrorString(errorString: WideString; rv: LongWord): HRESULT; dispid 5015;
    function GetSigAlgFromXML(xml_in: WideString; var retSigAlg: WideString): HRESULT; dispid 5016;
    function GetCertFromXML(inXML: WideString; inSignID: Integer; var outCert: WideString): HRESULT; dispid 5017;
    function XMLFinalize(): HRESULT; dispid 5018;
    function Finalize(): HRESULT; dispid 5019;
    function HashData(algorithm: WideString; flags: Integer; inData: WideString; var outData: WideString): HRESULT; dispid 5020;
    function SignHash(alias: WideString; flags: Integer; inHash: WideString; var outSign: WideString): HRESULT; dispid 5021;
    function TSASetUrl(tsaUrl: WideString): HRESULT; dispid 5022;
    function TSAGetTimeFromSig(inData: WideString; flags: Integer; sigId: Integer; var outDateTime: Int64): HRESULT; dispid 5023;
    function SignDataBytes(alias: WideString; flags: Integer; inData: Byte; inDataLength: Integer; var outSign: WideString): HRESULT; dispid 5024;
	  function SetProxy(flags: Integer; inProxyAddr: WideString; inPort: WideString; inUserName: WideString; inUserPass: WideString): HRESULT; dispid 5025;
    function GetCertFromCMS(inCMS: WideString; flags:Integer; inSignID: Integer; var outCert: WideString): HRESULT; dispid 5026;
    function VerifyDataBytes (alias: WideString; flags: Integer; inCertID: Integer;
                              inData: Byte; inDataLength: Integer; inSign: WideString;
                              var outData: WideString; var outVerifyInfo: WideString;
                              var outCert: WideString): HRESULT; dispid 5027;
    function SignWSSE(alias: WideString; flags: Integer; inData: WideString; signNodeId: WideString; var outSign: WideString): HRESULT; dispid 5028;
    function HashDataBytes(algorithm: WideString; flags: Integer; inData: Byte;
                            inDataLength: Integer; out outData: WideString): HRESULT; dispid 5029;
    function ZipConVerify(inZipFile: WideString; flags: Integer; out outVerifyInfo: WideString): HRESULT; dispid 5030;
    function ZipConSign(alias: WideString; inFiles: WideString; zipName: WideString; outDir: WideString; flags: Integer): HRESULT; dispid 5031;
    function GetCertFromZIP(inZipFile: WideString; flags: Integer; inSignID: Integer;
                             out outCert: WideString): HRESULT; dispid 5032;
  end;

// *********************************************************************//
// The Class CoKalkanCryptCOM provides a Create and CreateRemote method to
// create instances of the default interface IKalkanCryptCOM exposed by
// the CoClass KalkanCryptCOM. The functions are intended to be used by
// clients wishing to automate the CoClass objects exposed by the
// server of this typelibrary.
// *********************************************************************//
  CoKalkanCryptCOM = class
    class function Create: IKalkanCryptCOM;
    class function CreateRemote(const MachineName: string): IKalkanCryptCOM;
  end;

implementation

uses System.Win.ComObj;

class function CoKalkanCryptCOM.Create: IKalkanCryptCOM;
begin
  Result := CreateComObject(CLASS_KalkanCryptCOM) as IKalkanCryptCOM;
end;

class function CoKalkanCryptCOM.CreateRemote(const MachineName: string): IKalkanCryptCOM;
begin
  Result := CreateRemoteComObject(MachineName, CLASS_KalkanCryptCOM) as IKalkanCryptCOM;
end;

end.
