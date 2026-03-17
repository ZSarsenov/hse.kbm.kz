// +build windows

package main
//Подключаем внутренние библиотеки
import (
	"fmt"
	"os"
    "io"
   	"time"
   	"bufio"
	ole "../go-ole/utilities"
	"../go-ole/utilities/oleutil"
	constants "../go-ole/utilities" 
)

const inputdelimiter = '\n'

func main() {
	var alias string = "sha256"
	
	ole.CoInitialize(0)
//Вызываем COM-библиотеку
	kalkancomtest, err := oleutil.CreateObject("KalkanCryptCOMLib.KalkanCryptCOM.2")
	if (err != nil) {
		fmt.Println(err)
	}
	
	comtest, err := kalkancomtest.QueryInterface(ole.IID_IDispatch)

	if (err != nil) {
		fmt.Println(err)
	}
	
//Для вызова метода(функций), используется функция MustCallMethod из oleutil
	oleutil.MustCallMethod(comtest, "Init").ToIDispatch()


	var outCert string = ""
	var outData string = ""
	var signNodeId string = ""
	var parentSignNode string = ""
	var parentNameSpace string = ""
	var inDataXML string = ""
	var inData string = ""
	var outSignXML string = ""
	var outSign string = ""
	var errStr string = ""
	var outHashData string = ""
	var kalkanFlags uint = 0
	var rv uint32 = 0
	var name_cert string = ""

	
	fmt.Print("Введите имя сертификата:  ")
    fmt.Scanln(&name_cert)
    key_address := "C:\\Go\\go-ole\\GO_EXAMPLE\\" + name_cert + ".p12"
	
	oleutil.MustCallMethod(comtest, "LoadKeyStore", constants.KCST_PKCS12, "Qwerty12", key_address, "").ToIDispatch()
	oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
	if (rv != 0) {
		fmt.Println(err)
	}

	
	for {

		var nomer_komandi int
		fmt.Println("\n____________________________________________________________________\n")
		fmt.Println(" Показать сертификат - 1 \tИнформация о сертификате - 2 \n Подписать данные - 3 \t\tПроверить данные - 4 \n Хэшировать данные - 5 \t\tПодписать хэш-данные - 6 \n Подписать XML - 7 \t\tПроверить XML - 8 \n Получить сертификат из CMS - 9\tПолучить сертификат из XML - 10 \n Получить время подписи - 11 \tПроверка сертификата - 12 \n Получить сырую подпись - 13 \tПодписать дынные(подпись хранится отдельно) - 14 \n  \n Выход - 0 \n\n")        
		fmt.Print("Введите номер: ")
        fmt.Scanln(&nomer_komandi) 
        fmt.Println("____________________________________________________________________\n")

	
		if nomer_komandi == 1{
			fmt.Println("X509ExportCertificateFromStore...")
			rv = 0
			outCert = ""
			errStr = ""
			oleutil.MustCallMethod(comtest, "X509ExportCertificateFromStore", "", 0, &outCert).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
			if rv != 0 {
				fmt.Println(errStr)
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outCert)
			}
			fmt.Println("X509ExportCertificateFromStore... Ok \n")
		}
		
		if nomer_komandi == 2{
			fmt.Println("X509CertificateGetInfo...\n")
			rv = 0
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_COUNTRYNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
     		oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_SOPN, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_LOCALITYNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_ORG_NAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_ORGUNIT_NAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_ISSUER_COUNTRYNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData + "\n\nSUBJECT")
			}
			outData = ""
     		oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_COUNTRYNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_SOPN, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_LOCALITYNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_COMMONNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_GIVENNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_SURNAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
     		oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_SERIALNUMBER, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData + "\n")
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_EMAIL, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_ORG_NAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_ORGUNIT_NAME, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_BC, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJECT_DC, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_NOTBEFORE, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_NOTAFTER, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_KEY_USAGE, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_EXT_KEY_USAGE, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_AUTH_KEY_ID, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SUBJ_KEY_ID, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_CERT_SN, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData)
			}
			outData = ""
			oleutil.MustCallMethod(comtest, "X509CertificateGetInfo", outCert, constants.KC_CERTPROP_SIGNATURE_ALG, &outData).ToIDispatch()
			oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outData + "\n")
			}
			fmt.Println("X509CertificateGetInfo... Ok \n")			
		}

		if nomer_komandi == 3{
			fmt.Println("SignData...")
			rv = 0
			errStr = ""
			kalkanFlags = 774
			fmt.Print("Введите данные для подписи: ")
			reader := bufio.NewReader(os.Stdin)
		    inData1, _ := reader.ReadString(inputdelimiter)
		    inData = inData1
        	fmt.Println()
        	outSign = ""
	        oleutil.MustCallMethod(comtest, "SignData", alias, kalkanFlags, inData, &outSign)
	        oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
	        if rv != 0 {
				fmt.Println("Error: ",rv)
				fmt.Println(errStr)
			} else {
				fmt.Println(outSign)
			}
	        fmt.Println("SignData... Ok \n")
		}

		if nomer_komandi == 4{
			fmt.Println("VerifyData...\n")
			rv = 0
			errStr = ""
			outData = ""
		    var outVerifyInfo string = ""
		    outCert = ""
	        oleutil.MustCallMethod(comtest, "VerifyData"," ", kalkanFlags, 0, inData, outSign, &outData, &outVerifyInfo, &outCert)
			oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
	        if rv != 0 {
				fmt.Println("Error: ",rv)
				fmt.Println(errStr)
			} else {
				fmt.Println(outVerifyInfo +"\n\n"+outData + "\n")
			}
	        fmt.Println("VerifyData... Ok \n")
		}

		if nomer_komandi == 5{
			fmt.Println("HashData...")
			rv = 0
			kalkanFlags = 2054 
			fmt.Println("Введите данные для хэширования: ")
			reader := bufio.NewReader(os.Stdin)
		    inData, _ := reader.ReadString(inputdelimiter)
        	outHashData = ""
	        oleutil.MustCallMethod(comtest, "HashData", alias, kalkanFlags, inData, &outHashData)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
				fmt.Println("Error: ",rv)
			} else {
				fmt.Println(outHashData)
			}
	        fmt.Println("HashData... Ok \n")
		}

		if nomer_komandi == 6{
			fmt.Println("SignHash...\n")
			rv = 0
			if outHashData != "" {
				outSign = ""
			   	kalkanFlags = 530
		        oleutil.MustCallMethod(comtest, "SignHash",alias, kalkanFlags, outHashData, &outSign)
		        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
		        if rv != 0 {
					fmt.Println("Error: ",rv)
					errStr = ""
					oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
					fmt.Println(errStr)
				} else {
					fmt.Println(outSign)
				}
		        fmt.Println("SignHash... Ok \n")
			}else{
				fmt.Println("Нет ХЭШ-данных!")
				fmt.Println("SignHash... Ok \n")
			}		
		}

		if nomer_komandi == 7{
			fmt.Println("SignXML...")
			outSignXML = ""
			signNodeId = "" 
			parentSignNode = "" 
			parentNameSpace = ""
			inDataXML = ""
			rv = 0
			file, err := os.Open("C:\\Go\\go-ole\\GO_EXAMPLE\\primer.xml")
		    if err != nil{
		        fmt.Println(err) 
		        os.Exit(1) 
		    }
		    data := make([]byte, 64)
		     
		    for{
		        n, err := file.Read(data)
		        if err == io.EOF{   
		            break
		        }
		        inDataXML += string(data[:n])
		    }
	    	
	        oleutil.MustCallMethod(comtest, "SignXML", alias, 0, signNodeId, parentSignNode, parentNameSpace, inDataXML, &outSignXML)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
	        if rv != 0 {
				fmt.Println("Error: ",rv)
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
			} else {
				oleutil.MustCallMethod(comtest, "XMLFinalize").ToIDispatch()
	        	fmt.Println(outSignXML)
			}
	        fmt.Println("SignXML... Ok \n")
		}

		if nomer_komandi == 8{
			fmt.Println("VerifyXML...")
	    	rv = 0
	    	var outVerifyInfo string = ""
	        oleutil.MustCallMethod(comtest, "VerifyXML", "", 0, outSignXML, &outVerifyInfo)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
	        if rv != 0 {
				fmt.Println("Error: ",rv)
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
			} else {
				fmt.Println(outVerifyInfo)
			}	
	        fmt.Println("VerifyXML... Ok \n")
		}

		if nomer_komandi == 9{
			fmt.Println("GetCertFromCMS...")
	    	rv = 0
	    	outCert = ""
	    	kalkanFlags = 518 
	        oleutil.MustCallMethod(comtest, "GetCertFromCMS", outSign, kalkanFlags, 1, &outCert)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
	        if rv != 0 {
				fmt.Println("Error: ",rv)
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
			} else {
				fmt.Println(outCert)
			}	
	        fmt.Println("GetCertFromCMS... Ok \n")
		}

		if nomer_komandi == 10{
			fmt.Println("GetCertFromXML...")
	    	rv = 0
	    	outCert = ""
	        oleutil.MustCallMethod(comtest, "GetCertFromXML", outSignXML, 1, &outCert)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
			} else {
				fmt.Println(outCert)
			}	        
	        fmt.Println("GetCertFromXML... Ok \n")
		}

		if nomer_komandi == 11{
			fmt.Println("GetTimeFromSig...")
			rv = 0
			var outDateTime int64
			kalkanFlags = 774
	        oleutil.MustCallMethod(comtest, "TSAGetTimeFromSig", outSign, kalkanFlags, 0, &outDateTime)
	        oleutil.MustCallMethod(comtest, "GetLastError", &rv).ToIDispatch()
			if rv != 0 {
				fmt.Println("Error: ",rv)
				errStr = ""
				oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
				fmt.Println(errStr)
			} else {
				timeStart, _ := time.Parse(time.RFC822, "01 Jan 70 6:00 ALM") 
	            fmt.Printf("Время подписи: %v", timeStart.Add(time.Duration(outDateTime)*time.Second))
	        }
		}
			
		if nomer_komandi == 12{
			fmt.Println("X509ValidateCertificate...\n")
	    	rv = 0
	    	var outInfo string  = ""
            var validType int  = 0
            var validPath string = ""
            tmpD, _ := time.Parse(time.RFC822, "01 Jan 01") 
            fmt.Print("Выберите место проверки: \n \t1)http://ocsp.pki.gov.kz/ \n \t2)CRL \n")
		    reader := bufio.NewReader(os.Stdin)
		    result, _, err := reader.ReadRune()
		    if err != nil {
		        fmt.Println(err)
		        return
		    }
		    switch result {
			    case '1':
			    	validType = constants.KC_USE_OCSP
	                validPath = "http://ocsp.pki.gov.kz/"
	                break
			    case '2':
	                validType = constants.KC_USE_CRL
	                validPath = "C:\\Go\\go-ole\\GO_EXAMPLE\\gost.crl"
	                break
		    }
	        oleutil.MustCallMethod(comtest, "X509ValidateCertificate", outCert, validType, validPath, tmpD, &outInfo)
	        errStr = ""
			oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
			if rv != 0 {
				fmt.Println(int64(rv))
				fmt.Println(errStr)
			} else {
				fmt.Println(outInfo, "\n")
			}	        
	        fmt.Println("X509ValidateCertificate... Ok \n")
		}


		if nomer_komandi == 13{
            fmt.Println("DraftSignData...")
            rv = 0
            kalkanFlags = 2053
            fmt.Print("Введите данные для подписи: ")
			reader := bufio.NewReader(os.Stdin)
		    inData2, _ := reader.ReadString(inputdelimiter)

        	fmt.Println(kalkanFlags)
        	var outDraftSign string = ""
        	errStr = ""
	        oleutil.MustCallMethod(comtest, "SignData", alias, kalkanFlags, inData2, &outDraftSign)
	        oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
	        var ids int64
	        ids = int64(rv)
	        fmt.Printf("%T %T",rv, ids)
	        if rv != 0 {
				fmt.Println("Error: ",ids)

				fmt.Println(errStr)
			} else {
				fmt.Println(outDraftSign)
			}
            fmt.Println("DraftSignData... Ok \n")
        }

        if nomer_komandi == 14{
            fmt.Println("DetachedSignData...")
            kalkanFlags = 838
            fmt.Print("Введите данные для подписи: ")
			reader := bufio.NewReader(os.Stdin)
		    inData1, _ := reader.ReadString(inputdelimiter)
		    inData = inData1
        	fmt.Println()
        	outSign = ""
	        oleutil.MustCallMethod(comtest, "SignData", alias, kalkanFlags, inData, &outSign)
            errStr = ""
            rv = 0
			oleutil.MustCallMethod(comtest, "GetLastErrorString", &errStr, &rv)
			if rv != 0 {
				fmt.Println("Error: ",rv)
				fmt.Println(errStr)
			} else {
                fmt.Println(outSign)
            }
            fmt.Println("DetachedSignData... Ok \n")
        }

	
		if nomer_komandi == 0 {
			break
		}

	
	}

	
	
	ole.CoUninitialize()
}
