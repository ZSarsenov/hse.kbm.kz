using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace KalkanCryptTest
{
    public partial class Form1 : Form
    {
        public int kalkanFlags;
        KalkanCryptCOMLib.KalkanCryptCOM KalkanCOMTest = new KalkanCryptCOMLib.KalkanCryptCOM();

        //uint rv = 0;

        public Form1()
        {
            InitializeComponent();
            KalkanCOMTest.Init();
            ///////////////////////
            //Default form values//
            ///////////////////////
            cbb_storeType.SelectedIndex = 0;
            tb_pinCode.Text = "Qwerty12";
            tb_ocsp.Text = "http://ocsp.pki.gov.kz/";
            tb_signID.Text = "1";
            this.FormClosing += Form1_FormClosing;
            KalkanCOMTest.TSASetUrl("http://tsp.pki.gov.kz");
        }

        private void btn_selectKey_Click(object sender, EventArgs e)
        {
            uint err;
            string errStr;
            Stream myStream = null;
            string tokens, certAliasesString, filePath = "";
            int tokenCount, certCount, storage = 0;
            if (cbb_storeType.SelectedIndex == 0)
            {
                string message = "Не выбран тип ключевого хранилища!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                switch (cbb_storeType.SelectedIndex)
                {
                    case 1://PKCS #12
                        if (tb_pinCode.Text == "")
                        {
                            string message = "Не указан PIN код хранилища!";
                            string caption = "Ошибка";
                            MessageBoxButtons buttons = MessageBoxButtons.OK;
                            DialogResult result = MessageBox.Show(message, caption, buttons);
                            if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
                            break;
                        }
                        else
                        {
                            openFileDialogKeyPath.Title = "Выберите PKCS#12 файл";
                            //openFileDialogKeyPath.InitialDirectory = "c:\\";
                            openFileDialogKeyPath.Filter = "PKCS#12 File|*.p12";
                            openFileDialogKeyPath.RestoreDirectory = true;
                            if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
                            {
                                try
                                {
                                    if ((myStream = openFileDialogKeyPath.OpenFile()) != null)
                                        using (myStream) { filePath = openFileDialogKeyPath.FileName; }
                                }
                                catch (Exception ex)
                                {
                                    MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                                }
                            }
                            KalkanCOMTest.LoadKeyStore((int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_PKCS12, tb_pinCode.Text, filePath, "test");
                            err = KalkanCOMTest.GetLastError(out errStr);
                            if (err > 0)
                            {
                                textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                                break;
                            }
                            tb_keyPath.Text = filePath;
                        }
                        break;
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 7:
                    case 8:
                        if (cbb_storeType.SelectedIndex == 2) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_KZIDCARD;
                        else if (cbb_storeType.SelectedIndex == 3) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_KAZTOKEN;
                        else if (cbb_storeType.SelectedIndex == 4) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_ETOKEN72K;
                        else if (cbb_storeType.SelectedIndex == 5) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_JACARTA;
                        else if (cbb_storeType.SelectedIndex == 7) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_AKEY;
                        else if (cbb_storeType.SelectedIndex == 8) storage = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_STORETYPE.KCST_JACARTA;
                        KalkanCOMTest.GetTokens((int)storage, out tokens, out tokenCount);
                        if (tokenCount == 0)
                        {
                            string message = "Нет подключенных устройств!";
                            string caption = "Ошибка";
                            MessageBoxButtons buttons = MessageBoxButtons.OK;
                            DialogResult result = MessageBox.Show(message, caption, buttons);
                            if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
                            break;
                        }
                        else tb_keyPath.Text = tokens;
                        KalkanCOMTest.LoadKeyStore((int)storage, tb_pinCode.Text, tb_keyPath.Text, " ");
                        err = KalkanCOMTest.GetLastError(out errStr);
                        if (err > 0)
                        {
                            textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                            break;
                        }
                        KalkanCOMTest.GetCertAliases(out certAliasesString, out certCount);
                        err = KalkanCOMTest.GetLastError(out errStr);
                        if (err > 0)
                        {
                            textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                            break;
                        }
                        comboBox1.Items.Clear();
                        if (certCount > 0)
                        {
                            char[] delimiterChars = { ' ', ';' };
                            string[] certAliasesArray = certAliasesString.Split(delimiterChars);
                            foreach (string certAlias in certAliasesArray)
                            {
                                comboBox1.Items.Add(certAlias);
                            }
                        }
                        break;
                    case 6:
                        openFileDialogKeyPath.Title = "Выберите сертификат";
                        openFileDialogKeyPath.InitialDirectory = "c:\\";
                        openFileDialogKeyPath.Filter = "Certificate File|*.cer;*crt;*.pem";
                        openFileDialogKeyPath.RestoreDirectory = true;
                        if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
                        {
                            try
                            {
                                if ((myStream = openFileDialogKeyPath.OpenFile()) != null)
                                    using (myStream) { filePath = openFileDialogKeyPath.FileName; }
                            }
                            catch (Exception ex)
                            {
                                MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                            }

                        }
                        KalkanCOMTest.X509LoadCertificateFromFile(filePath, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTTYPE.KC_CERT_USER);
                        err = KalkanCOMTest.GetLastError(out errStr);
                        if (err > 0)
                        {
                            textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                            break;
                        }
                        tb_keyPath.Text = filePath;
                        break;
                }
            }
            certAliasesString = "";
        }

        private void btn_selectcrl_Click(object sender, EventArgs e)
        {
            string filePath = "";
            Stream myStream = null;
            openFileDialogKeyPath.Title = "Выберите CRL файл";
            openFileDialogCRL.InitialDirectory = "c:\\";
            openFileDialogCRL.Filter = "CRL файл|*.crl";
            openFileDialogCRL.RestoreDirectory = true;
            if (openFileDialogCRL.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    if ((myStream = openFileDialogCRL.OpenFile()) != null)
                        using (myStream) { filePath = openFileDialogCRL.FileName; }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                }
            }
            tb_crl.Text = filePath;
        }

        private void btn_showCert_Click(object sender, EventArgs e)
        {

            string outCert = " ";
            string errStr;
            uint err;
            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                string alias = comboBox1.Text;
                KalkanCOMTest.X509ExportCertificateFromStore(alias, (int)kalkanFlags, out outCert);
                err = KalkanCOMTest.GetLastError(out errStr);
                if (err > 0)
                {
                    textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                }
                textBox6.Text = outCert;
            }
        }

        private void btn_infoCert_Click(object sender, EventArgs e)
        {
            string outData, err_str = "";
            uint err; ;
            if (textBox6.Text == "")
            {
                string message = "Не указан сертификат!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                string cert = textBox6.Text;
                textBox7.Text = "ISSUER" + Environment.NewLine;

                //KC_CERTPROP_ISSUER_COUNTRYNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_COUNTRYNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_ISSUER_SOPN
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_SOPN, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_ISSUER_LOCALITYNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_LOCALITYNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_ISSUER_ORG_NAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_ORG_NAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_ISSUER_ORGUNIT_NAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_ORGUNIT_NAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_ISSUER_COMMONNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_ISSUER_COMMONNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;


                textBox7.Text += Environment.NewLine + "SUBJECT" + Environment.NewLine;


                //KC_CERTPROP_SUBJECT_COUNTRYNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_COUNTRYNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_SOPN
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_SOPN, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_LOCALITYNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_LOCALITYNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;


                //KC_CERTPROP_SUBJECT_COMMONNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_COMMONNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_GIVENNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_GIVENNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_SURNAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_SURNAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_SERIALNUMBER
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_SERIALNUMBER, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_EMAIL
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_EMAIL, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_ORG_NAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_ORG_NAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_ORGUNIT_NAME
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_ORGUNIT_NAME, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_BC
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_BC, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJECT_DC
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJECT_DC, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_NOTBEFORE
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_NOTBEFORE, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_NOTAFTER
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_NOTAFTER, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_KEY_USAGE
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_KEY_USAGE, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_EXT_KEY_USAGE
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_EXT_KEY_USAGE, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_AUTH_KEY_ID
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_AUTH_KEY_ID, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SUBJ_KEY_ID
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SUBJ_KEY_ID, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_CERT_SN
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_CERT_SN, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_SIGNATURE_ALG
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_SIGNATURE_ALG, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_PUBKEY
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_PUBKEY, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_OCPS
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_OCSP, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_GET_CRL
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_GET_CRL, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;

                //KC_CERTPROP_GET_DELTA_CRL
                KalkanCOMTest.X509CertificateGetInfo(cert, (int)KalkanCryptCOMLib.KALKANCRYPTCOM_CERTPROPID.KC_CERTPROP_GET_DELTA_CRL, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                if (err == 0) textBox7.Text += outData + Environment.NewLine;
            }
        }

        private void btn_hashData_Click(object sender, EventArgs e)
        {
            string outData = "", err_str = "";
            uint err;
            if (textBox6.Text == "")
            {
                string message = "Нет данных для хеширования!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                KalkanCOMTest.HashData(comboBox1.Text, (int)kalkanFlags, textBox6.Text, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                textBox7.Text = outData;
            }
        }

        private void btn_signHashData_Click(object sender, EventArgs e)
        {
            string outData = "", err_str = "";
            uint err;
            if (textBox7.Text == "")
            {
                string message = "Нет хэш данных для подписи!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                string inHash;
                if (!rb_inBase64.Checked)
                {
                    string ascii = string.Empty;

                    for (int i = 0; i < textBox7.Text.Length; i += 2)
                    {
                        String hs = string.Empty;

                        hs = textBox7.Text.Substring(i, 2);
                        uint decval = System.Convert.ToUInt32(hs, 16);
                        char character = System.Convert.ToChar(decval);
                        ascii += character;
                    }
                    inHash = ascii;
                }
                else inHash = textBox7.Text;
                KalkanCOMTest.SignHash(comboBox1.Text, (int)kalkanFlags, inHash, out outData);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                textBox8.Text = outData;
            }
        }

        private void btn_signData_Click(object sender, EventArgs e)
        {
            string outSign = "", errStr = "";
            uint err;
            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                if (textBox7.Text != "")
                {
                    outSign = textBox7.Text;
                }

                {
                    if ((kalkanFlags & (int)(KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_DER)) == (int)(KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_DER))
                    {
                        kalkanFlags |= (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_BASE64;
                    }
                    KalkanCOMTest.SignData(comboBox1.Text, (int)kalkanFlags, textBox6.Text, ref outSign);
                }
                KalkanCOMTest.GetLastErrorString(out errStr, out err);
                if (err > 0)
                {
                    textBox8.Text = " Error: 0x" + err.ToString("X8") + "\r\n" + errStr.Replace("\n", "\r\n");
                }
                textBox7.Text = outSign;
            }
        }

        private void btn_verifyData_Click(object sender, EventArgs e)
        {
            string inData = textBox6.Text;
            string inSign = textBox7.Text;
            string outData = " ";
            string outVerifyInfo = " ";
            string outCert = " ", err_str = "";
            uint err;

            KalkanCOMTest.VerifyData(" ", (int)kalkanFlags, 0, inData, inSign, out outData, out outVerifyInfo, out outCert);
            KalkanCOMTest.GetLastErrorString(out err_str, out err);
            if (err > 0)
            {
                textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str + Environment.NewLine + Environment.NewLine;
            }
            if (outCert != " ")
            {
                textBox6.Text = outCert;
            }
            if (outVerifyInfo != " ")
            {
                textBox8.Text += outVerifyInfo.Replace("\n", "\r\n") + Environment.NewLine + Environment.NewLine;
            }
            if (outData != " ")
            {
                textBox8.Text += outData;
            }
        }

        private void btn_signXML_Click(object sender, EventArgs e)
        {
            string signNodeId = "";
            string parentSignNode = "";
            string parentNameSpace = "";
            string inData = textBox6.Text;
            string alias = comboBox1.Text;
            string outSign = "", err_str = "";
            uint err;
            //flags = (int)(KalkanCryptCOMLib.KALKANCRYPTCOM_XMLPARAMS.KC_XMLC_EXCL_C14N) | (int)(KalkanCryptCOMLib.KALKANCRYPTCOM_XMLPARAMS.KC_XML_EXCL_C14N);
            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                //for (int j = 0; j < 1000; j++)
                {
                    KalkanCOMTest.SignXML(alias, kalkanFlags, signNodeId, parentSignNode, parentNameSpace, inData, out outSign);
                }
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                textBox7.Text = outSign.Replace("\n", "\r\n");
                KalkanCOMTest.XMLFinalize();
            }
        }

        private void btn_verifyXML_Click(object sender, EventArgs e)
        {
            string inXML = textBox7.Text;
            string outVerifyInfo = " ";
            uint err;
            string errStr = " ";
            if (textBox7.Text == "")
            {
                string message = "Нет подписанной XML!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                //verify xml
                string inXML2 = textBox7.Text;
                KalkanCOMTest.VerifyXML(" ", kalkanFlags, inXML2, out outVerifyInfo);
                
                KalkanCOMTest.GetLastErrorString(out errStr, out err);
                if (err > 0)
                {
                    textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine;
                    if (outVerifyInfo != null)
                        textBox8.Text += outVerifyInfo.Replace("\n", "\r\n");
                    textBox8.Text += Environment.NewLine + errStr.Replace("\n", "\r\n");
                    return;
                }
                else
                {
                    textBox8.Text = outVerifyInfo.Replace("\n", "\r\n");
                    inXML = "";
                    inXML2 = "";
                    outVerifyInfo = "";
                }
            }
        }

        private void btn_getCertFromXML_Click(object sender, EventArgs e)
        {
            string outCert = "", err_str = "";
            uint err;
            if (textBox7.Text == "")
            {
                string message = "Нет XML!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                KalkanCOMTest.GetCertFromXML(textBox7.Text, Int32.Parse(tb_signID.Text), out outCert);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                textBox6.Text = outCert;
            }
        }

        private void btn_checkCert_Click(object sender, EventArgs e)
        {
            string outInfo = "", getOCSP_resp = "";
            string inCert = textBox6.Text;
            int validType = 0;
            string validPath = "";
            uint err;
            string errStr;
            DateTime tmpD = new DateTime();
            if (rb_ocsp.Checked)
            {
                validType = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_VALIDTYPE.KC_USE_OCSP;
                validPath = tb_ocsp.Text;
            }
            else if (rb_crl.Checked)
            {
                validType = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_VALIDTYPE.KC_USE_CRL;
                validPath = tb_crl.Text;
            }

            KalkanCOMTest.X509ValidateCertificate(inCert, validType, validPath, tmpD, out outInfo, kalkanFlags, out getOCSP_resp);

            KalkanCOMTest.GetLastErrorString(out errStr, out err);
            if (err > 0)
            {
                textBox8.Text = " Error: 0x" + err.ToString("X8") + Environment.NewLine;
                if (outInfo != null)
                {
                    textBox8.Text += outInfo.Replace("\n", "\r\n");
                    textBox8.Text += Environment.NewLine + errStr.Replace("\n", "\r\n");
                    textBox7.Text = getOCSP_resp;
                }
            }
            else
            {
                textBox8.Text = outInfo.Replace("\r", "\r\n");
                textBox7.Text = getOCSP_resp;
            }
        }


        private void btn_signFile_Click(object sender, EventArgs e)
        {
            byte[] inData = { };
            //string inData = "";
            string tmpData = "";
            string outSign = "", errStr = "";
            uint err;
            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                try
                {
                    //inData = System.IO.File.ReadAllText("D:\\test\\test.txt");
                    //inData = File.ReadAllBytes("D:\\temp\\sign\\sign\\test-1.txt");
                    inData = File.ReadAllBytes("D:\\Описание KalkanCryptCOM.docx");
                    //inData = File.ReadAllBytes("D:\\test\\test.txt");
                }
                catch (Exception)
                {
                    System.Console.WriteLine("Ошибка: Не удалось прочитать файл!");
                }
                //tmpData = System.Text.Encoding.UTF8.GetString(inData, 0, inData.Length);
                int len = tmpData.Length;

                //KalkanCOMTest.SignDataBytes("", kalkanFlags, ref inData[0], inData.Length, out outSign);
                KalkanCOMTest.SignDataBytes("", (int)kalkanFlags, ref inData[0], inData.Length, out outSign);
                KalkanCOMTest.GetLastErrorString(out errStr, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                textBox7.Text = outSign;
            }
        }

        private void btn_verifyFile_Click(object sender, EventArgs e)
        {
            //byte[] inData = { };
            string inData = "";
            string outCert, outData;
            string outVerifyInfo = "";
            string inSign = textBox7.Text;
            //string filePath = "C:\\temp\\Письмо регистрация ДТС РБ.pdf";
            string filePath = "D:\\test\\test.txt";
            string err_str = "";
            uint err;
            try
            {
                //inData = File.ReadAllBytes(filePath);
                inData = File.ReadAllText(filePath);
            }
            catch (Exception)
            {
                System.Console.WriteLine("Ошибка: Не удалось прочитать файл: " + filePath + "!");
            }
            KalkanCOMTest.VerifyData("", (int)kalkanFlags, 0, inData, inSign, out outData, out outVerifyInfo, out outCert);
            //KalkanCOMTest.VerifyDataBytes("", (uint)kalkanFlags, 0, ref inData[0], inData.Length, inSign, out outData, out outVerifyInfo, out outCert);
            KalkanCOMTest.GetLastErrorString(out err_str, out err);
            if (err > 0)
            {
                textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine;
                textBox8.Text += outVerifyInfo.Replace("\n", "\r\n");
            }
            textBox8.Text = outVerifyInfo.Replace("\n", "\r\n");
            //File.Open("D:\\test\\test_out.txt", FileMode.OpenOrCreate);
            File.WriteAllText("D:\\test\\test_out.txt", outData);

        }

        private void rb_inBase64_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_inPEM_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_inDER_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void cb_in2Base64_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_outBase64_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_outPEM_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_outDER_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void cb_draftData_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void cb_detachedSign_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void cb_addTimeStamp_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void cb_verifyCert_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }
        private void rb_sha_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void rb_gost_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }
        private void cb_getResp_CheckedChanged(object sender, EventArgs e)
        {
            KC_Flags_Click();
        }

        private void KC_Flags_Click()
        {
            kalkanFlags = 0;

            if (rb_inBase64.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN_BASE64;
            if (rb_inPEM.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN_PEM;
            if (rb_inDER.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN_DER;
            if (cb_inFile.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN_FILE;
            if (cb_in2Base64.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN2_BASE64;

            if (rb_outBase64.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_BASE64;
            if (rb_outPEM.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_PEM;
            if (rb_outDER.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_OUT_DER;

            if (cb_draftData.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_SIGN_DRAFT;
            else kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_SIGN_CMS;
            if (cb_detachedSign.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_DETACHED_DATA;
            if (cb_addTimeStamp.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_WITH_TIMESTAMP;
            if (cb_verifyCert.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_NOCHECKCERTTIME;
            if (cb_getResp.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_GET_OCSP_RESPONSE;

            if (rb_sha.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_HASH_SHA256;
            if (rb_gost.Checked) kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_HASH_GOST95;
        }


        private void btn_GetTimeFromSig_Click(object sender, EventArgs e)
        {
            string inData = textBox7.Text;
            string errorString = "";
            uint err = 0;
            long outDateTime;
            KalkanCOMTest.TSAGetTimeFromSig(inData, (int)kalkanFlags, 0, out outDateTime);
            KalkanCOMTest.GetLastErrorString(out errorString, out err);
            if (err > 0)
            {
                textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine;
                textBox8.Text += errorString.Replace("\n", "\r\n");
            }
            else
            {
                DateTime date = new DateTime(1970, 1, 1).AddSeconds(outDateTime).AddHours(5); //Добавим 5 часов - часовой пояс Алматы
                textBox8.Text += "Время подписи: " + date.ToString("dd.MM.yyyy HH-mm-ss") + " +05:00";
            }

        }

        private void btn_cleanForm_Click(object sender, EventArgs e)
        {
            textBox6.Text = "";
            textBox7.Text = "";
            textBox8.Text = "";
        }

        private void checkBox1_CheckedChanged(object sender, EventArgs e)
        {
            tb_login.Enabled = checkBox1.Checked;
            tb_pass.Enabled = checkBox1.Checked;
        }

        private void tb_port_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (((e.KeyChar < '0') || (e.KeyChar > '9')) && (e.KeyChar != 0x08))
            {
                e.Handled = true;
            }

        }

        private void button1_Click(object sender, EventArgs e)
        {
            string proxyAddr = tb_addr.Text, proxyPort = tb_port.Text, proxyUName = tb_login.Text, proxyUPass = tb_pass.Text;
            int flags = (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_PROXY_ON;
            if (checkBox1.Checked)
            {
                flags |= (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_PROXY_AUTH;
            }
            KalkanCOMTest.SetProxy(flags, proxyAddr, proxyPort, proxyUName, proxyUPass);

        }

        private void btn_GetCertFromCMS_Click(object sender, EventArgs e)
        {
            string outCert = "", err_str = "";
            uint err;
            if (textBox7.Text == "")
            {
                string message = "Нет CMS!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                KalkanCOMTest.GetCertFromCMS(textBox7.Text, kalkanFlags, Int32.Parse(tb_signID.Text), out outCert);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                textBox6.Text = outCert;
            }
        }

        private void btn_signwsse_Click(object sender, EventArgs e)
        {
            string signNodeId = comboBox1.Text;
            string inData = textBox6.Text;
            string alias = comboBox1.Text;
            string outSign = "", err_str = "";
            uint err;
            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {
                KalkanCOMTest.SignWSSE(alias, kalkanFlags, inData, signNodeId, out outSign);
                KalkanCOMTest.GetLastErrorString(out err_str, out err);
                if (err > 0) textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + err_str.Replace("\n", "\r\n");
                else textBox7.Text = outSign.Replace("\n", "\r\n");
                KalkanCOMTest.XMLFinalize();
            }
        }

        private void btn_hashFile_Click(object sender, EventArgs e)
        {
            Stream myStream = null;
            string filePath = "";
            byte[] inData = { };
            string outData = ""; //inData = "", 
            string errStr = "";
            uint err = 0;


            {

                openFileDialogKeyPath.Title = "Выберите файл";
                openFileDialogKeyPath.Filter = "";
                openFileDialogKeyPath.RestoreDirectory = true;
                if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
                {
                    try
                    {
                        if ((myStream = openFileDialogKeyPath.OpenFile()) != null)
                            using (myStream) { filePath = openFileDialogKeyPath.FileName; }
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                    }
                }
                kalkanFlags = kalkanFlags | (int)KalkanCryptCOMLib.KALKANCRYPTCOM_FLAGS.KC_IN_FILE;
                if (comboBox1.Text == "sha256")
                {
                    KalkanCOMTest.HashData("sha256", kalkanFlags, filePath, out outData);
                }
                else
                {
                    KalkanCOMTest.HashData("Gost34311_95", kalkanFlags, filePath, out outData);
                }
                

                KalkanCOMTest.GetLastErrorString(out errStr, out err);
                if (err > 0)
                    textBox8.Text += " Error: 0x" + err.ToString("X8") + Environment.NewLine + errStr.Replace("\n", "\r\n");
                else 
                    textBox7.Text = outData;
            }

        }

        private void btn_vfyZip_Click(object sender, EventArgs e)
        {
            string outInfo = " ";
            Stream myStream = null;
            string filePath = "";
            string errorString = " ";
            uint err = 0;

            openFileDialogKeyPath.Title = "Выберите файл";
            openFileDialogKeyPath.Filter = "";
            openFileDialogKeyPath.RestoreDirectory = true;
            if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    if ((myStream = openFileDialogKeyPath.OpenFile()) != null)
                        using (myStream) { filePath = openFileDialogKeyPath.FileName; }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                }
            }
            KalkanCOMTest.ZipConVerify(filePath, kalkanFlags, out outInfo);
            if (outInfo != null)
                textBox7.Text = outInfo.Replace("\n", "\r\n");
            KalkanCOMTest.GetLastErrorString(out errorString, out err);
           // if (err != 0)
                textBox8.Text = errorString;

        }
        private void getCertFromZIP_Click(object sender, EventArgs e)
        {
            string outCert = "";
            Stream myStream = null;
            string filePath = "";
            string errorString = " ";
            uint err = 0;
            openFileDialogKeyPath.Title = "Выберите файл";
            openFileDialogKeyPath.Filter = "";
            openFileDialogKeyPath.RestoreDirectory = true;
            if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    if ((myStream = openFileDialogKeyPath.OpenFile()) != null)
                        using (myStream) { filePath = openFileDialogKeyPath.FileName; }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                }
            }
            KalkanCOMTest.GetCertFromZIP(filePath, kalkanFlags, Int32.Parse(tb_signID.Text), out outCert);

            KalkanCOMTest.GetLastErrorString(out errorString, out err);

            if (err > 0)
            {

                textBox8.Text += " Error SigVerify: 0x" + err.ToString("X8") + Environment.NewLine + errorString + Environment.NewLine;
            }
            else
            {
                textBox6.Text = outCert.Replace("\n", "\r\n");
            }
        }

        private void btn_signzip_Click(object sender, EventArgs e)
        {
            string alias = comboBox1.Text, zipName = "", outDir = "", fileNames = "";
            string[] files = null;
            string errStr = "";
            uint err = 0;

            if (tb_keyPath.Text == "")
            {
                string message = "Не указан путь к ключу!";
                string caption = "Ошибка";
                MessageBoxButtons buttons = MessageBoxButtons.OK;
                DialogResult result = MessageBox.Show(message, caption, buttons);
                if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
            }
            else
            {

                openFileDialogKeyPath.Title = "Выберите файл";
                openFileDialogKeyPath.Filter = "";
                openFileDialogKeyPath.Multiselect = true;
                openFileDialogKeyPath.RestoreDirectory = true;
                if (openFileDialogKeyPath.ShowDialog() == DialogResult.OK)
                {
                    try
                    {
                        files = openFileDialogKeyPath.FileNames;
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Ошибка: Не удалось прочитать файл с диска. Original error: " + ex.Message);
                    }
                }
                
                for (int i = 0; i < (files.Length); i++)
                {
                    fileNames += files[i] + "|";
                }

                using (var fbd = new FolderBrowserDialog())
                {
                    DialogResult result = fbd.ShowDialog();

                    if (result == DialogResult.OK && !string.IsNullOrWhiteSpace(fbd.SelectedPath))
                    {
                        outDir = fbd.SelectedPath;
                    }
                }

                zipName = comboBox1.Text;
                KalkanCOMTest.ZipConSign(alias, fileNames, zipName, outDir, kalkanFlags);
                KalkanCOMTest.GetLastErrorString(out errStr, out err);
                if (err > 0)
                {
                    textBox8.Text = errStr;
                }
                else
                {
                    string message = "Формирование архива прошло успешно!";
                    string caption = "Сообщение";
                    MessageBoxButtons buttons = MessageBoxButtons.OK;
                    DialogResult result = MessageBox.Show(message, caption, buttons);
                    if (result == System.Windows.Forms.DialogResult.Yes) { this.Close(); }
                }


            }
        }

        private void Form1_FormClosing(Object sender, FormClosingEventArgs e)
        {
            switch (MessageBox.Show(this, "Вы уверены?",
                                    "Действительно хотите выйти?",
                                    MessageBoxButtons.YesNo, MessageBoxIcon.Question))
            {
                case DialogResult.No:
                    // Остаемся в этой форме
                    e.Cancel = true;
                    break;
                default:
                    KalkanCOMTest.Finalize();
                    break;
            }

        }       
    }
}