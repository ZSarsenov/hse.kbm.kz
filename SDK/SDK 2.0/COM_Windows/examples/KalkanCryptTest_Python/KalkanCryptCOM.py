import sys 
import os

from PyQt5 import QtWidgets
from PyQt5.QtWidgets import (QMainWindow, QTextEdit,QAction, QFileDialog, QApplication, QMessageBox)
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import pyqtSlot


import win32com.client
import constants
import datetime
import KalkanForm

class ExampleApp(QtWidgets.QMainWindow, KalkanForm.Ui_MainWindow):
    def __init__(self):
        
        super().__init__()
        self.setupUi(self) 
        self.pinCode.setText("Qwerty12")
        self.certAlias.setDisabled(True)
        self.login.setDisabled(True)
        self.pass_line.setDisabled(True)
            
        global KalkanCOMTest, kalkanFlags, alias
        kalkanFlags = 0
        

        KalkanCOMTest = win32com.client.Dispatch("KalkanCryptCOMLib.KalkanCryptCOM.2")
        KalkanCOMTest.Init()
       
        self.selectKey.clicked.connect(self.onOpen)
        self.selectCRL.clicked.connect(self.CRL_Open)
        self.b_showCert.clicked.connect(self.showCertificate_Click)
        self.b_infoCert.clicked.connect(self.infoCertificate_Click)
        self.b_signData.clicked.connect(self.signData_Click)
        self.b_verifyData.clicked.connect(self.verifyData_Click)
        self.b_hashData.clicked.connect(self.hashData_Click)
        self.b_verifyHashData.clicked.connect(self.signHashData_Click)
        self.b_signXML.clicked.connect(self.signXML_Click)
        self.b_verifyXML.clicked.connect(self.verifySignXML_Click)
        self.b_getCertFromCMS.clicked.connect(self.getCertFromCMS_Click)
        self.b_getCertFromXML.clicked.connect(self.getCertFromXML_Click)
        self.b_checkCert.clicked.connect(self.checkCert_Click)
        self.b_getTimeFromSign.clicked.connect(self.getTimeFromSign_Click)
        self.b_clear.clicked.connect(self.Clear_Click)
        self.cb_proxy.clicked.connect(self.check_proxy_Click)
        self.b_save.clicked.connect(self.Save_Click)
        
        self.rb_inBase64.clicked.connect(self.KalkanFlags_Click)
        self.rb_inPEM.clicked.connect(self.KalkanFlags_Click)
        self.rb_inDER.clicked.connect(self.KalkanFlags_Click)
        self.rb_outBase64.clicked.connect(self.KalkanFlags_Click)
        self.rb_outPEM.clicked.connect(self.KalkanFlags_Click)
        self.rb_outDER.clicked.connect(self.KalkanFlags_Click)
        self.cb_in2Base64.clicked.connect(self.KalkanFlags_Click)
        self.cb_draftSign.clicked.connect(self.KalkanFlags_Click)
        self.cb_detachedSign.clicked.connect(self.KalkanFlags_Click)
        self.cb_addTimeStamp.clicked.connect(self.KalkanFlags_Click)
        self.certAlias.activated.connect(self.certAlias_Click)

    def onOpen(self):
        type_store_in = self.storeType.currentIndex()
        global alias
        if self.pinCode.text() != "":
            if type_store_in == 0:
                QMessageBox.question(self, 'Ошибка!', "Выберите тип хранилища!", QMessageBox.Ok, QMessageBox.Ok)
            elif type_store_in == 1:
                try: 
                    dialogSelectFiles = QFileDialog(self, 'Выберите ключ', os.getenv('~','/K'), 'application (*.p12 )')
                    if dialogSelectFiles: 
                       dialogSelectFiles.exec_()
                       self.keyPath.setText('\n'.join(dialogSelectFiles.selectedFiles()))
                    KalkanCOMTest.LoadKeyStore(constants.KCST_PKCS12,self.pinCode.text(),self.keyPath.text(), 'test')
                    strErr, err = KalkanCOMTest.GetLastErrorString()
                    if err > 0:
                       self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))
                    alias = "sha256"
                except ValueError:
                    QMessageBox.question(self, 'Ошибка!', "Не удалось прочитать файл с диска!", QMessageBox.Ok, QMessageBox.Ok)
            elif (type_store_in == 2) or (type_store_in == 3) or (type_store_in == 4) or (type_store_in == 5):
                if type_store_in == 2:
                    storage = constants.KCST_KZIDCARD
                elif type_store_in == 3:
                    storage = constants.KCST_KAZTOKEN
                elif type_store_in == 4:
                    storage = constants.KCST_ETOKEN72K
                elif type_store_in == 5:
                    storage = constants.KCST_JACARTA
                tokens, tokenCount = KalkanCOMTest.GetTokens(storage)
                if tokenCount == 0:
                    QMessageBox.question(self, 'Ошибка!', "Нет подключенных устройств!", QMessageBox.Ok, QMessageBox.Ok)
                else:
                    self.certAlias.setDisabled(False)
                    self.keyPath.setText(tokens)
                    KalkanCOMTest.LoadKeyStore(storage, self.pinCode.text(),self.keyPath.text(), " ")
                    strErr, err = KalkanCOMTest.GetLastErrorString()
                    if err > 0:
                       self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))
                    certAliasesString, certCount = KalkanCOMTest.GetCertAliases()
                    strErr, err = KalkanCOMTest.GetLastErrorString()
                    if err > 0:
                       self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))
                    self.certAlias.clear()
                    a = certAliasesString.replace(',',' ').replace(';',' ').replace('.',' ').split()
                    for i in a:
                        self.certAlias.addItem(i)
                    alias = self.certAlias.currentText()
            elif type_store_in == 6 :
                try: 
                    dialogSelectFiles = QFileDialog(self, 'Выберите сертификат', os.getenv('~','/K'), 'Certificate File (*.cer;*crt;*.pem )')
                    if dialogSelectFiles: 
                       dialogSelectFiles.exec_()
                       self.keyPath.setText('\n'.join(dialogSelectFiles.selectedFiles()))
                    KalkanCOMTest.X509LoadCertificateFromFile(self.keyPath.text(), constants.KC_CERT_USER)
                    strErr, err = KalkanCOMTest.GetLastErrorString()
                    if err > 0:
                       self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))
                except ValueError:
                    QMessageBox.question(self, 'Ошибка!', "Не удалось прочитать файл с диска!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            QMessageBox.question(self, 'Ошибка!', "Введите пароль!", QMessageBox.Ok, QMessageBox.Ok)

    def certAlias_Click(self):
        global alias
        alias = self.certAlias.currentText()
   
    def infoCertificate_Click(self):
        Cert = self.textBOX1.toPlainText()
        
        try:
            outData = "ISSUER \n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_COUNTRYNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_SOPN)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_LOCALITYNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_ORG_NAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_ORGUNIT_NAME)
            outData += KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_ISSUER_COMMONNAME)
            outData += "\n\nSUBJECT\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_COUNTRYNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_SOPN)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_LOCALITYNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_COMMONNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_GIVENNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_SURNAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_SERIALNUMBER)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_EMAIL)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_ORG_NAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_ORGUNIT_NAME)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_BC)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJECT_DC)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_NOTBEFORE)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_NOTAFTER)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_KEY_USAGE)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_EXT_KEY_USAGE)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_AUTH_KEY_ID)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SUBJ_KEY_ID)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_CERT_SN)
            outData += "\n" + KalkanCOMTest.X509CertificateGetInfo(Cert, constants.KC_CERTPROP_SIGNATURE_ALG)
            self.textBOX2.setText(outData)
        except ValueError:
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def CRL_Open(self):
        try: 
            dialogSelectFiles = QFileDialog(self, 'Выберите ключ', os.getenv('~','/K'), 'CRL (*.crl )')
            if dialogSelectFiles: 
                dialogSelectFiles.exec_()
                self.CRLpath.setText('\n'.join(dialogSelectFiles.selectedFiles()))
        except ValueError:
            QMessageBox.question(self, 'Ошибка!', "Не удалось прочитать файл с диска!", QMessageBox.Ok, QMessageBox.Ok)
                
    def KalkanFlags_Click(self):
        global kalkanFlags 
        kalkanFlags = 0
        if self.rb_inBase64.isChecked() == True:    kalkanFlags += constants.KC_IN_BASE64
        if self.rb_inPEM.isChecked() == True:   kalkanFlags += constants.KC_IN_PEM
        if self.rb_inDER.isChecked() == True:   kalkanFlags += constants.KC_IN_DER
        if self.cb_in2Base64.isChecked(): kalkanFlags += constants.KC_IN2_BASE64
            
        if self.rb_outBase64.isChecked() == True:   kalkanFlags += constants.KC_OUT_BASE64
        if self.rb_outPEM.isChecked() == True:  kalkanFlags += constants.KC_OUT_PEM
        if self.rb_outDER.isChecked() == True:  kalkanFlags += constants.KC_OUT_DER

        if self.cb_draftSign.isChecked():  kalkanFlags += constants.KC_SIGN_DRAFT
        else:   kalkanFlags += constants.KC_SIGN_CMS
        if self.cb_detachedSign.isChecked():   kalkanFlags += constants.KC_DETACHED_DATA
        if self.cb_addTimeStamp.isChecked():    kalkanFlags += constants.KC_WITH_TIMESTAMP
        print(kalkanFlags)

    def showCertificate_Click(self):
        global outCert
        outCert = ''
        try:
            outCert = KalkanCOMTest.X509ExportCertificateFromStore(alias, 0)
            self.textBOX1.setText(outCert)
        except:
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def signData_Click(self):
        global outSign
        outSign = ""
        if self.keyPath.text() == "" :
            QMessageBox.question(self, 'Ошибка!', "Не указан путь к ключу", QMessageBox.Ok, QMessageBox.Ok)
        elif self.textBOX1.toPlainText() == "11" :
            QMessageBox.question(self, 'Ошибка!', "Нет данных для подписи", QMessageBox.Ok, QMessageBox.Ok)
        else:
            try: 
                outSign = KalkanCOMTest.SignData('', kalkanFlags, self.textBOX1.toPlainText())
                self.textBOX2.setText(outSign)
            except :
                strErr, err = KalkanCOMTest.GetLastErrorString()
                if err > 0:
                   self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def verifyData_Click(self):
        inData = self.textBOX1.toPlainText()
        inSign = self.textBOX2.toPlainText()
        outData = ""
        outVerifyInfo = ""
        outCert = ""
        outData, outVerifyInfo, outCert =  KalkanCOMTest.VerifyData(" ", kalkanFlags, 0, inData, inSign)
        self.textBOX3.setText(outVerifyInfo + "\n\n" + outData)
        self.textBOX1.setText(outCert)
        strErr, err = KalkanCOMTest.GetLastErrorString()
        if err > 0:
            self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def hashData_Click(self):
        if self.textBOX1.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет данных для хеширования!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outData = KalkanCOMTest.HashData("sha256",  kalkanFlags, self.textBOX1.toPlainText())
            self.textBOX2.setText(outData)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def signHashData_Click(self):
        if self.textBOX2.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет ХЭШ -данных для подписи!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outData = KalkanCOMTest.SignHash(alias, kalkanFlags, self.textBOX2.toPlainText())
            self.textBOX2.setText(outData)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def signXML_Click(self):
        signNodeId = ""
        parentSignNode = ""
        parentNameSpace = ""
        inData = self.textBOX1.toPlainText()

        if self.textBOX1.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет XML-данных для подписи!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outSign = KalkanCOMTest.SignXML(alias, 0, signNodeId, parentSignNode, parentNameSpace, inData)
            KalkanCOMTest.XMLFinalize()
            self.textBOX2.setText(outSign)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def verifySignXML_Click(self):
        inXML = self.textBOX2.toPlainText()
        if self.textBOX2.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет подписанной XML!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outVerifyInfo = KalkanCOMTest.VerifyXML(" ", 0, inXML)
            self.textBOX3.setText(outVerifyInfo)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def getCertFromXML_Click(self):
        if self.textBOX2.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет подписанной XML!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outCert = KalkanCOMTest.GetCertFromXML(self.textBOX2.toPlainText(), self.SignID.text())
            self.textBOX1.setText(outCert)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def getCertFromCMS_Click(self):
        if self.textBOX2.toPlainText() == "" :
            QMessageBox.question(self, 'Ошибка!', "Нет CMS!", QMessageBox.Ok, QMessageBox.Ok)
        else:
            outCert = KalkanCOMTest.GetCertFromCMS(self.textBOX2.toPlainText(), kalkanFlags, self.SignID.text())
            self.textBOX1.setText(outCert)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def checkCert_Click(self):
        inCert = self.textBOX1.toPlainText()
        validType = 0
        validPath = ""
        tmpD = datetime.datetime.now()
        if self.rb_OCSPURL.isChecked() == True:
            validType = constants.KC_USE_OCSP
            validPath = self.OCSPpath.text()
        elif self.rb_CRL.isChecked() == True:
            validType = constants.KC_USE_CRL
            validPath = self.CRLpath.text() 
        outInfo = KalkanCOMTest.X509ValidateCertificate(inCert, validType, validPath, tmpD)
        self.textBOX3.setText(outInfo)
        strErr, err = KalkanCOMTest.GetLastErrorString()
        if err > 0:
           self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

    def getTimeFromSign_Click(self):
        outDateTime = KalkanCOMTest.TSAGetTimeFromSig(self.textBOX2.toPlainText(), kalkanFlags, 0)
        strErr, err = KalkanCOMTest.GetLastErrorString()
        if err > 0:
           self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))
        else:
            date = datetime.datetime(1970, 1, 1,6,0,0) + datetime.timedelta(seconds=int(outDateTime))
            self.textBOX3.setText( "Время подписи: " + date.strftime("%d-%m-%Y %H:%M:%S")+ "   по времени Астаны")

    def Clear_Click(self):
        self.textBOX1.setText("")
        self.textBOX2.setText("")
        self.textBOX3.setText("")

    def check_proxy_Click(self):
        if self.cb_proxy.isChecked():
            self.login.setDisabled(False)
            self.pass_line.setDisabled(False)
        else:
            self.login.setDisabled(True)
            self.pass_line.setDisabled(True)
            
    def Save_Click(self):
            proxyAddr = self.adres.text()
            proxyPort = self.port.text()
            proxyUName = self.login.text()
            proxyUPass = self.pass_line.text()
            flags = constants.KC_PROXY_ON
            if self.cb_proxy.isChecked():
                flags += constants.KC_PROXY_AUTH
            KalkanCOMTest.SetProxy(flags, proxyAddr, proxyPort, proxyUName, proxyUPass)
            strErr, err = KalkanCOMTest.GetLastErrorString()
            if err > 0:
               self.textBOX3.setText(" Error: " + str(hex(int(err))) + "\n" + strErr.replace("\n","\r\n"))

def main():
    app = QtWidgets.QApplication(sys.argv)  
    window = ExampleApp()  
    window.show()  
    app.exec_()

if __name__ == '__main__':  
    main()  
