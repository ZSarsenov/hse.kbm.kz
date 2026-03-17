namespace KalkanCryptTest
{
    partial class Form1
    {
        /// <summary>
        /// Обязательная переменная конструктора.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Освободить все используемые ресурсы.
        /// </summary>
        /// <param name="disposing">истинно, если управляемый ресурс должен быть удален; иначе ложно.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Код, автоматически созданный конструктором форм Windows

        /// <summary>
        /// Требуемый метод для поддержки конструктора — не изменяйте 
        /// содержимое этого метода с помощью редактора кода.
        /// </summary>
        private void InitializeComponent()
        {
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.getCertFromZIP = new System.Windows.Forms.Button();
            this.groupBox4 = new System.Windows.Forms.GroupBox();
            this.rb_gost = new System.Windows.Forms.RadioButton();
            this.rb_sha = new System.Windows.Forms.RadioButton();
            this.btn_signzip = new System.Windows.Forms.Button();
            this.btn_hashFile = new System.Windows.Forms.Button();
            this.btn_signwsse = new System.Windows.Forms.Button();
            this.btn_GetCertFromCMS = new System.Windows.Forms.Button();
            this.btn_GetTimeFromSig = new System.Windows.Forms.Button();
            this.label5 = new System.Windows.Forms.Label();
            this.btn_signHashData = new System.Windows.Forms.Button();
            this.btn_hashData = new System.Windows.Forms.Button();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.cb_inFile = new System.Windows.Forms.CheckBox();
            this.cb_in2Base64 = new System.Windows.Forms.CheckBox();
            this.rb_inDER = new System.Windows.Forms.RadioButton();
            this.rb_inPEM = new System.Windows.Forms.RadioButton();
            this.rb_inBase64 = new System.Windows.Forms.RadioButton();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.rb_outDER = new System.Windows.Forms.RadioButton();
            this.rb_outPEM = new System.Windows.Forms.RadioButton();
            this.rb_outBase64 = new System.Windows.Forms.RadioButton();
            this.btn_cleanForm = new System.Windows.Forms.Button();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.cb_verifyCert = new System.Windows.Forms.CheckBox();
            this.cb_addTimeStamp = new System.Windows.Forms.CheckBox();
            this.cb_detachedSign = new System.Windows.Forms.CheckBox();
            this.cb_draftData = new System.Windows.Forms.CheckBox();
            this.textBox8 = new System.Windows.Forms.TextBox();
            this.textBox7 = new System.Windows.Forms.TextBox();
            this.textBox6 = new System.Windows.Forms.TextBox();
            this.btn_vfyZip = new System.Windows.Forms.Button();
            this.btn_verifyFile = new System.Windows.Forms.Button();
            this.btn_signFile = new System.Windows.Forms.Button();
            this.btn_checkCert = new System.Windows.Forms.Button();
            this.tb_signID = new System.Windows.Forms.TextBox();
            this.label4 = new System.Windows.Forms.Label();
            this.btn_getCertFromXML = new System.Windows.Forms.Button();
            this.btn_verifyXML = new System.Windows.Forms.Button();
            this.btn_signXML = new System.Windows.Forms.Button();
            this.btn_verifyData = new System.Windows.Forms.Button();
            this.btn_signData = new System.Windows.Forms.Button();
            this.btn_infoCert = new System.Windows.Forms.Button();
            this.btn_showCert = new System.Windows.Forms.Button();
            this.comboBox1 = new System.Windows.Forms.ComboBox();
            this.btn_selectcrl = new System.Windows.Forms.Button();
            this.tb_crl = new System.Windows.Forms.TextBox();
            this.rb_crl = new System.Windows.Forms.RadioButton();
            this.tb_ocsp = new System.Windows.Forms.TextBox();
            this.rb_ocsp = new System.Windows.Forms.RadioButton();
            this.btn_selectKey = new System.Windows.Forms.Button();
            this.tb_keyPath = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.tb_pinCode = new System.Windows.Forms.TextBox();
            this.label2 = new System.Windows.Forms.Label();
            this.cbb_storeType = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.tabControl1 = new System.Windows.Forms.TabControl();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.panel1 = new System.Windows.Forms.Panel();
            this.button1 = new System.Windows.Forms.Button();
            this.tb_pass = new System.Windows.Forms.TextBox();
            this.tb_login = new System.Windows.Forms.TextBox();
            this.tb_port = new System.Windows.Forms.TextBox();
            this.tb_addr = new System.Windows.Forms.TextBox();
            this.checkBox1 = new System.Windows.Forms.CheckBox();
            this.label10 = new System.Windows.Forms.Label();
            this.label9 = new System.Windows.Forms.Label();
            this.label8 = new System.Windows.Forms.Label();
            this.label7 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.openFileDialogKeyPath = new System.Windows.Forms.OpenFileDialog();
            this.openFileDialogCRL = new System.Windows.Forms.OpenFileDialog();
            this.cb_getResp = new System.Windows.Forms.CheckBox();
            this.tabPage1.SuspendLayout();
            this.groupBox4.SuspendLayout();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.groupBox3.SuspendLayout();
            this.tabControl1.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.panel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.getCertFromZIP);
            this.tabPage1.Controls.Add(this.groupBox4);
            this.tabPage1.Controls.Add(this.btn_signzip);
            this.tabPage1.Controls.Add(this.btn_hashFile);
            this.tabPage1.Controls.Add(this.btn_signwsse);
            this.tabPage1.Controls.Add(this.btn_GetCertFromCMS);
            this.tabPage1.Controls.Add(this.btn_GetTimeFromSig);
            this.tabPage1.Controls.Add(this.label5);
            this.tabPage1.Controls.Add(this.btn_signHashData);
            this.tabPage1.Controls.Add(this.btn_hashData);
            this.tabPage1.Controls.Add(this.groupBox1);
            this.tabPage1.Controls.Add(this.groupBox2);
            this.tabPage1.Controls.Add(this.btn_cleanForm);
            this.tabPage1.Controls.Add(this.groupBox3);
            this.tabPage1.Controls.Add(this.textBox8);
            this.tabPage1.Controls.Add(this.textBox7);
            this.tabPage1.Controls.Add(this.textBox6);
            this.tabPage1.Controls.Add(this.btn_vfyZip);
            this.tabPage1.Controls.Add(this.btn_verifyFile);
            this.tabPage1.Controls.Add(this.btn_signFile);
            this.tabPage1.Controls.Add(this.btn_checkCert);
            this.tabPage1.Controls.Add(this.tb_signID);
            this.tabPage1.Controls.Add(this.label4);
            this.tabPage1.Controls.Add(this.btn_getCertFromXML);
            this.tabPage1.Controls.Add(this.btn_verifyXML);
            this.tabPage1.Controls.Add(this.btn_signXML);
            this.tabPage1.Controls.Add(this.btn_verifyData);
            this.tabPage1.Controls.Add(this.btn_signData);
            this.tabPage1.Controls.Add(this.btn_infoCert);
            this.tabPage1.Controls.Add(this.btn_showCert);
            this.tabPage1.Controls.Add(this.comboBox1);
            this.tabPage1.Controls.Add(this.btn_selectcrl);
            this.tabPage1.Controls.Add(this.tb_crl);
            this.tabPage1.Controls.Add(this.rb_crl);
            this.tabPage1.Controls.Add(this.tb_ocsp);
            this.tabPage1.Controls.Add(this.rb_ocsp);
            this.tabPage1.Controls.Add(this.btn_selectKey);
            this.tabPage1.Controls.Add(this.tb_keyPath);
            this.tabPage1.Controls.Add(this.label3);
            this.tabPage1.Controls.Add(this.tb_pinCode);
            this.tabPage1.Controls.Add(this.label2);
            this.tabPage1.Controls.Add(this.cbb_storeType);
            this.tabPage1.Controls.Add(this.label1);
            this.tabPage1.Location = new System.Drawing.Point(4, 22);
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage1.Size = new System.Drawing.Size(924, 783);
            this.tabPage1.TabIndex = 0;
            this.tabPage1.Text = "Подписание/проверка XML и данных";
            this.tabPage1.UseVisualStyleBackColor = true;
            // 
            // getCertFromZIP
            // 
            this.getCertFromZIP.Location = new System.Drawing.Point(643, 368);
            this.getCertFromZIP.Name = "getCertFromZIP";
            this.getCertFromZIP.Size = new System.Drawing.Size(211, 23);
            this.getCertFromZIP.TabIndex = 44;
            this.getCertFromZIP.Text = "Получить сертификат из ZIP";
            this.getCertFromZIP.UseVisualStyleBackColor = true;
            this.getCertFromZIP.Click += new System.EventHandler(this.getCertFromZIP_Click);
            // 
            // groupBox4
            // 
            this.groupBox4.BackColor = System.Drawing.Color.Transparent;
            this.groupBox4.Controls.Add(this.rb_gost);
            this.groupBox4.Controls.Add(this.rb_sha);
            this.groupBox4.Cursor = System.Windows.Forms.Cursors.Hand;
            this.groupBox4.Location = new System.Drawing.Point(803, 68);
            this.groupBox4.Name = "groupBox4";
            this.groupBox4.Size = new System.Drawing.Size(99, 55);
            this.groupBox4.TabIndex = 43;
            this.groupBox4.TabStop = false;
            // 
            // rb_gost
            // 
            this.rb_gost.AutoSize = true;
            this.rb_gost.Location = new System.Drawing.Point(6, 32);
            this.rb_gost.Name = "rb_gost";
            this.rb_gost.Size = new System.Drawing.Size(95, 17);
            this.rb_gost.TabIndex = 3;
            this.rb_gost.TabStop = true;
            this.rb_gost.Text = "Gost34311_95";
            this.rb_gost.UseVisualStyleBackColor = true;
            this.rb_gost.CheckedChanged += new System.EventHandler(this.rb_gost_CheckedChanged);
            // 
            // rb_sha
            // 
            this.rb_sha.AutoSize = true;
            this.rb_sha.Location = new System.Drawing.Point(6, 11);
            this.rb_sha.Name = "rb_sha";
            this.rb_sha.Size = new System.Drawing.Size(60, 17);
            this.rb_sha.TabIndex = 4;
            this.rb_sha.TabStop = true;
            this.rb_sha.Text = "sha256";
            this.rb_sha.UseVisualStyleBackColor = true;
            this.rb_sha.CheckedChanged += new System.EventHandler(this.rb_sha_CheckedChanged);
            // 
            // btn_signzip
            // 
            this.btn_signzip.Location = new System.Drawing.Point(643, 711);
            this.btn_signzip.Name = "btn_signzip";
            this.btn_signzip.Size = new System.Drawing.Size(125, 23);
            this.btn_signzip.TabIndex = 42;
            this.btn_signzip.Text = "Sign Zip file";
            this.btn_signzip.UseVisualStyleBackColor = true;
            this.btn_signzip.Click += new System.EventHandler(this.btn_signzip_Click);
            // 
            // btn_hashFile
            // 
            this.btn_hashFile.Location = new System.Drawing.Point(643, 100);
            this.btn_hashFile.Name = "btn_hashFile";
            this.btn_hashFile.Size = new System.Drawing.Size(154, 23);
            this.btn_hashFile.TabIndex = 41;
            this.btn_hashFile.Text = "Вычислить хэш файла";
            this.btn_hashFile.UseVisualStyleBackColor = true;
            this.btn_hashFile.Click += new System.EventHandler(this.btn_hashFile_Click);
            // 
            // btn_signwsse
            // 
            this.btn_signwsse.Location = new System.Drawing.Point(774, 258);
            this.btn_signwsse.Name = "btn_signwsse";
            this.btn_signwsse.Size = new System.Drawing.Size(128, 23);
            this.btn_signwsse.TabIndex = 40;
            this.btn_signwsse.Text = "Подписать WSSE";
            this.btn_signwsse.UseVisualStyleBackColor = true;
            this.btn_signwsse.Click += new System.EventHandler(this.btn_signwsse_Click);
            // 
            // btn_GetCertFromCMS
            // 
            this.btn_GetCertFromCMS.Location = new System.Drawing.Point(643, 343);
            this.btn_GetCertFromCMS.Name = "btn_GetCertFromCMS";
            this.btn_GetCertFromCMS.Size = new System.Drawing.Size(211, 23);
            this.btn_GetCertFromCMS.TabIndex = 39;
            this.btn_GetCertFromCMS.Text = "Получить сертификат из CMS";
            this.btn_GetCertFromCMS.UseVisualStyleBackColor = true;
            this.btn_GetCertFromCMS.Click += new System.EventHandler(this.btn_GetCertFromCMS_Click);
            // 
            // btn_GetTimeFromSig
            // 
            this.btn_GetTimeFromSig.Location = new System.Drawing.Point(643, 220);
            this.btn_GetTimeFromSig.Name = "btn_GetTimeFromSig";
            this.btn_GetTimeFromSig.Size = new System.Drawing.Size(259, 25);
            this.btn_GetTimeFromSig.TabIndex = 38;
            this.btn_GetTimeFromSig.Text = "Получить время подписи";
            this.btn_GetTimeFromSig.UseVisualStyleBackColor = true;
            this.btn_GetTimeFromSig.Click += new System.EventHandler(this.btn_GetTimeFromSig_Click);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(640, 475);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(189, 13);
            this.label5.TabIndex = 26;
            this.label5.Text = "Формат входных/выходных данных";
            // 
            // btn_signHashData
            // 
            this.btn_signHashData.Location = new System.Drawing.Point(643, 127);
            this.btn_signHashData.Name = "btn_signHashData";
            this.btn_signHashData.Size = new System.Drawing.Size(259, 23);
            this.btn_signHashData.TabIndex = 37;
            this.btn_signHashData.Text = "Подписать хэш-данные";
            this.btn_signHashData.UseVisualStyleBackColor = true;
            this.btn_signHashData.Click += new System.EventHandler(this.btn_signHashData_Click);
            // 
            // btn_hashData
            // 
            this.btn_hashData.Location = new System.Drawing.Point(643, 75);
            this.btn_hashData.Name = "btn_hashData";
            this.btn_hashData.Size = new System.Drawing.Size(154, 23);
            this.btn_hashData.TabIndex = 36;
            this.btn_hashData.Text = "Хэшировать данные";
            this.btn_hashData.UseVisualStyleBackColor = true;
            this.btn_hashData.Click += new System.EventHandler(this.btn_hashData_Click);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.cb_inFile);
            this.groupBox1.Controls.Add(this.cb_in2Base64);
            this.groupBox1.Controls.Add(this.rb_inDER);
            this.groupBox1.Controls.Add(this.rb_inPEM);
            this.groupBox1.Controls.Add(this.rb_inBase64);
            this.groupBox1.Location = new System.Drawing.Point(643, 488);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(133, 110);
            this.groupBox1.TabIndex = 27;
            this.groupBox1.TabStop = false;
            // 
            // cb_inFile
            // 
            this.cb_inFile.AutoSize = true;
            this.cb_inFile.Location = new System.Drawing.Point(6, 89);
            this.cb_inFile.Name = "cb_inFile";
            this.cb_inFile.Size = new System.Drawing.Size(62, 17);
            this.cb_inFile.TabIndex = 5;
            this.cb_inFile.Text = "IN FILE";
            this.cb_inFile.UseVisualStyleBackColor = true;
            // 
            // cb_in2Base64
            // 
            this.cb_in2Base64.AutoSize = true;
            this.cb_in2Base64.Location = new System.Drawing.Point(6, 70);
            this.cb_in2Base64.Name = "cb_in2Base64";
            this.cb_in2Base64.Size = new System.Drawing.Size(82, 17);
            this.cb_in2Base64.TabIndex = 3;
            this.cb_in2Base64.Text = "IN2 Base64";
            this.cb_in2Base64.UseVisualStyleBackColor = true;
            this.cb_in2Base64.CheckedChanged += new System.EventHandler(this.cb_in2Base64_CheckedChanged);
            // 
            // rb_inDER
            // 
            this.rb_inDER.AutoSize = true;
            this.rb_inDER.Location = new System.Drawing.Point(6, 50);
            this.rb_inDER.Name = "rb_inDER";
            this.rb_inDER.Size = new System.Drawing.Size(62, 17);
            this.rb_inDER.TabIndex = 2;
            this.rb_inDER.TabStop = true;
            this.rb_inDER.Text = "IN DER";
            this.rb_inDER.UseVisualStyleBackColor = true;
            this.rb_inDER.CheckedChanged += new System.EventHandler(this.rb_inDER_CheckedChanged);
            // 
            // rb_inPEM
            // 
            this.rb_inPEM.AutoSize = true;
            this.rb_inPEM.Location = new System.Drawing.Point(6, 30);
            this.rb_inPEM.Name = "rb_inPEM";
            this.rb_inPEM.Size = new System.Drawing.Size(62, 17);
            this.rb_inPEM.TabIndex = 1;
            this.rb_inPEM.TabStop = true;
            this.rb_inPEM.Text = "IN PEM";
            this.rb_inPEM.UseVisualStyleBackColor = true;
            this.rb_inPEM.CheckedChanged += new System.EventHandler(this.rb_inPEM_CheckedChanged);
            // 
            // rb_inBase64
            // 
            this.rb_inBase64.AutoSize = true;
            this.rb_inBase64.Location = new System.Drawing.Point(6, 10);
            this.rb_inBase64.Name = "rb_inBase64";
            this.rb_inBase64.Size = new System.Drawing.Size(75, 17);
            this.rb_inBase64.TabIndex = 0;
            this.rb_inBase64.TabStop = true;
            this.rb_inBase64.Text = "IN Base64";
            this.rb_inBase64.UseVisualStyleBackColor = true;
            this.rb_inBase64.CheckedChanged += new System.EventHandler(this.rb_inBase64_CheckedChanged);
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.rb_outDER);
            this.groupBox2.Controls.Add(this.rb_outPEM);
            this.groupBox2.Controls.Add(this.rb_outBase64);
            this.groupBox2.Location = new System.Drawing.Point(774, 488);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(128, 110);
            this.groupBox2.TabIndex = 28;
            this.groupBox2.TabStop = false;
            // 
            // rb_outDER
            // 
            this.rb_outDER.AutoSize = true;
            this.rb_outDER.Location = new System.Drawing.Point(6, 50);
            this.rb_outDER.Name = "rb_outDER";
            this.rb_outDER.Size = new System.Drawing.Size(74, 17);
            this.rb_outDER.TabIndex = 2;
            this.rb_outDER.TabStop = true;
            this.rb_outDER.Text = "OUT DER";
            this.rb_outDER.UseVisualStyleBackColor = true;
            this.rb_outDER.CheckedChanged += new System.EventHandler(this.rb_outDER_CheckedChanged);
            // 
            // rb_outPEM
            // 
            this.rb_outPEM.AutoSize = true;
            this.rb_outPEM.Location = new System.Drawing.Point(6, 30);
            this.rb_outPEM.Name = "rb_outPEM";
            this.rb_outPEM.Size = new System.Drawing.Size(74, 17);
            this.rb_outPEM.TabIndex = 1;
            this.rb_outPEM.TabStop = true;
            this.rb_outPEM.Text = "OUT PEM";
            this.rb_outPEM.UseVisualStyleBackColor = true;
            this.rb_outPEM.CheckedChanged += new System.EventHandler(this.rb_outPEM_CheckedChanged);
            // 
            // rb_outBase64
            // 
            this.rb_outBase64.AutoSize = true;
            this.rb_outBase64.Location = new System.Drawing.Point(6, 10);
            this.rb_outBase64.Name = "rb_outBase64";
            this.rb_outBase64.Size = new System.Drawing.Size(87, 17);
            this.rb_outBase64.TabIndex = 0;
            this.rb_outBase64.TabStop = true;
            this.rb_outBase64.Text = "OUT Base64";
            this.rb_outBase64.UseVisualStyleBackColor = true;
            this.rb_outBase64.CheckedChanged += new System.EventHandler(this.rb_outBase64_CheckedChanged);
            // 
            // btn_cleanForm
            // 
            this.btn_cleanForm.Location = new System.Drawing.Point(643, 744);
            this.btn_cleanForm.Name = "btn_cleanForm";
            this.btn_cleanForm.Size = new System.Drawing.Size(259, 23);
            this.btn_cleanForm.TabIndex = 35;
            this.btn_cleanForm.Text = "Очистить";
            this.btn_cleanForm.UseVisualStyleBackColor = true;
            this.btn_cleanForm.Click += new System.EventHandler(this.btn_cleanForm_Click);
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.cb_getResp);
            this.groupBox3.Controls.Add(this.cb_verifyCert);
            this.groupBox3.Controls.Add(this.cb_addTimeStamp);
            this.groupBox3.Controls.Add(this.cb_detachedSign);
            this.groupBox3.Controls.Add(this.cb_draftData);
            this.groupBox3.Location = new System.Drawing.Point(643, 594);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(259, 111);
            this.groupBox3.TabIndex = 34;
            this.groupBox3.TabStop = false;
            // 
            // cb_verifyCert
            // 
            this.cb_verifyCert.AutoSize = true;
            this.cb_verifyCert.Location = new System.Drawing.Point(6, 69);
            this.cb_verifyCert.Name = "cb_verifyCert";
            this.cb_verifyCert.Size = new System.Drawing.Size(242, 17);
            this.cb_verifyCert.TabIndex = 43;
            this.cb_verifyCert.Text = "Не проверять срок действия сертификата";
            this.cb_verifyCert.UseVisualStyleBackColor = true;
            this.cb_verifyCert.CheckedChanged += new System.EventHandler(this.cb_verifyCert_CheckedChanged);
            // 
            // cb_addTimeStamp
            // 
            this.cb_addTimeStamp.AutoSize = true;
            this.cb_addTimeStamp.Location = new System.Drawing.Point(6, 50);
            this.cb_addTimeStamp.Name = "cb_addTimeStamp";
            this.cb_addTimeStamp.Size = new System.Drawing.Size(210, 17);
            this.cb_addTimeStamp.TabIndex = 2;
            this.cb_addTimeStamp.Text = "Добавить метку времени в подпись";
            this.cb_addTimeStamp.UseVisualStyleBackColor = true;
            this.cb_addTimeStamp.CheckedChanged += new System.EventHandler(this.cb_addTimeStamp_CheckedChanged);
            // 
            // cb_detachedSign
            // 
            this.cb_detachedSign.AutoSize = true;
            this.cb_detachedSign.Location = new System.Drawing.Point(6, 30);
            this.cb_detachedSign.Name = "cb_detachedSign";
            this.cb_detachedSign.Size = new System.Drawing.Size(223, 17);
            this.cb_detachedSign.TabIndex = 1;
            this.cb_detachedSign.Text = "Подпись хранится отдельно от данных";
            this.cb_detachedSign.UseVisualStyleBackColor = true;
            this.cb_detachedSign.CheckedChanged += new System.EventHandler(this.cb_detachedSign_CheckedChanged);
            // 
            // cb_draftData
            // 
            this.cb_draftData.AutoSize = true;
            this.cb_draftData.Location = new System.Drawing.Point(6, 10);
            this.cb_draftData.Name = "cb_draftData";
            this.cb_draftData.Size = new System.Drawing.Size(220, 17);
            this.cb_draftData.TabIndex = 0;
            this.cb_draftData.Text = "Сырая подпись (V - Draft Sign, 0 - CMS)";
            this.cb_draftData.UseVisualStyleBackColor = true;
            this.cb_draftData.CheckedChanged += new System.EventHandler(this.cb_draftData_CheckedChanged);
            // 
            // textBox8
            // 
            this.textBox8.Font = new System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBox8.Location = new System.Drawing.Point(13, 629);
            this.textBox8.Multiline = true;
            this.textBox8.Name = "textBox8";
            this.textBox8.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.textBox8.Size = new System.Drawing.Size(609, 139);
            this.textBox8.TabIndex = 33;
            // 
            // textBox7
            // 
            this.textBox7.Font = new System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBox7.Location = new System.Drawing.Point(13, 348);
            this.textBox7.Multiline = true;
            this.textBox7.Name = "textBox7";
            this.textBox7.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.textBox7.Size = new System.Drawing.Size(609, 276);
            this.textBox7.TabIndex = 32;
            // 
            // textBox6
            // 
            this.textBox6.Font = new System.Drawing.Font("Courier New", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBox6.Location = new System.Drawing.Point(13, 102);
            this.textBox6.Multiline = true;
            this.textBox6.Name = "textBox6";
            this.textBox6.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.textBox6.Size = new System.Drawing.Size(609, 240);
            this.textBox6.TabIndex = 31;
            // 
            // btn_vfyZip
            // 
            this.btn_vfyZip.Location = new System.Drawing.Point(777, 711);
            this.btn_vfyZip.Name = "btn_vfyZip";
            this.btn_vfyZip.Size = new System.Drawing.Size(125, 23);
            this.btn_vfyZip.TabIndex = 30;
            this.btn_vfyZip.Text = "Verify Zip file";
            this.btn_vfyZip.UseVisualStyleBackColor = true;
            this.btn_vfyZip.Click += new System.EventHandler(this.btn_vfyZip_Click);
            // 
            // btn_verifyFile
            // 
            this.btn_verifyFile.Location = new System.Drawing.Point(777, 435);
            this.btn_verifyFile.Name = "btn_verifyFile";
            this.btn_verifyFile.Size = new System.Drawing.Size(125, 23);
            this.btn_verifyFile.TabIndex = 25;
            this.btn_verifyFile.Text = "Проверить файл";
            this.btn_verifyFile.UseVisualStyleBackColor = true;
            this.btn_verifyFile.Click += new System.EventHandler(this.btn_verifyFile_Click);
            // 
            // btn_signFile
            // 
            this.btn_signFile.Location = new System.Drawing.Point(643, 435);
            this.btn_signFile.Name = "btn_signFile";
            this.btn_signFile.Size = new System.Drawing.Size(125, 23);
            this.btn_signFile.TabIndex = 24;
            this.btn_signFile.Text = "Подписать файл";
            this.btn_signFile.UseVisualStyleBackColor = true;
            this.btn_signFile.Click += new System.EventHandler(this.btn_signFile_Click);
            // 
            // btn_checkCert
            // 
            this.btn_checkCert.Location = new System.Drawing.Point(643, 404);
            this.btn_checkCert.Name = "btn_checkCert";
            this.btn_checkCert.Size = new System.Drawing.Size(259, 23);
            this.btn_checkCert.TabIndex = 22;
            this.btn_checkCert.Text = "Проверка сертификата";
            this.btn_checkCert.UseVisualStyleBackColor = true;
            this.btn_checkCert.Click += new System.EventHandler(this.btn_checkCert_Click);
            // 
            // tb_signID
            // 
            this.tb_signID.Location = new System.Drawing.Point(870, 344);
            this.tb_signID.Name = "tb_signID";
            this.tb_signID.Size = new System.Drawing.Size(23, 20);
            this.tb_signID.TabIndex = 21;
            // 
            // label4
            // 
            this.label4.Location = new System.Drawing.Point(854, 328);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(48, 13);
            this.label4.TabIndex = 20;
            this.label4.Text = "  Sign ID";
            // 
            // btn_getCertFromXML
            // 
            this.btn_getCertFromXML.Location = new System.Drawing.Point(643, 318);
            this.btn_getCertFromXML.Name = "btn_getCertFromXML";
            this.btn_getCertFromXML.Size = new System.Drawing.Size(211, 23);
            this.btn_getCertFromXML.TabIndex = 19;
            this.btn_getCertFromXML.Text = "Получить сертификат из XML";
            this.btn_getCertFromXML.UseVisualStyleBackColor = true;
            this.btn_getCertFromXML.Click += new System.EventHandler(this.btn_getCertFromXML_Click);
            // 
            // btn_verifyXML
            // 
            this.btn_verifyXML.Location = new System.Drawing.Point(643, 286);
            this.btn_verifyXML.Name = "btn_verifyXML";
            this.btn_verifyXML.Size = new System.Drawing.Size(259, 23);
            this.btn_verifyXML.TabIndex = 18;
            this.btn_verifyXML.Text = "Проверить XML";
            this.btn_verifyXML.UseVisualStyleBackColor = true;
            this.btn_verifyXML.Click += new System.EventHandler(this.btn_verifyXML_Click);
            // 
            // btn_signXML
            // 
            this.btn_signXML.Location = new System.Drawing.Point(643, 258);
            this.btn_signXML.Name = "btn_signXML";
            this.btn_signXML.Size = new System.Drawing.Size(125, 23);
            this.btn_signXML.TabIndex = 17;
            this.btn_signXML.Text = "Подписать XML";
            this.btn_signXML.UseVisualStyleBackColor = true;
            this.btn_signXML.Click += new System.EventHandler(this.btn_signXML_Click);
            // 
            // btn_verifyData
            // 
            this.btn_verifyData.Location = new System.Drawing.Point(643, 189);
            this.btn_verifyData.Name = "btn_verifyData";
            this.btn_verifyData.Size = new System.Drawing.Size(259, 25);
            this.btn_verifyData.TabIndex = 16;
            this.btn_verifyData.Text = "Проверить данные";
            this.btn_verifyData.UseVisualStyleBackColor = true;
            this.btn_verifyData.Click += new System.EventHandler(this.btn_verifyData_Click);
            // 
            // btn_signData
            // 
            this.btn_signData.Location = new System.Drawing.Point(643, 160);
            this.btn_signData.Name = "btn_signData";
            this.btn_signData.Size = new System.Drawing.Size(259, 23);
            this.btn_signData.TabIndex = 15;
            this.btn_signData.Text = "Подписать данные";
            this.btn_signData.UseVisualStyleBackColor = true;
            this.btn_signData.Click += new System.EventHandler(this.btn_signData_Click);
            // 
            // btn_infoCert
            // 
            this.btn_infoCert.Location = new System.Drawing.Point(643, 41);
            this.btn_infoCert.Name = "btn_infoCert";
            this.btn_infoCert.Size = new System.Drawing.Size(259, 23);
            this.btn_infoCert.TabIndex = 14;
            this.btn_infoCert.Text = "Информация о сертификате";
            this.btn_infoCert.UseVisualStyleBackColor = true;
            this.btn_infoCert.Click += new System.EventHandler(this.btn_infoCert_Click);
            // 
            // btn_showCert
            // 
            this.btn_showCert.Location = new System.Drawing.Point(643, 15);
            this.btn_showCert.Name = "btn_showCert";
            this.btn_showCert.Size = new System.Drawing.Size(259, 23);
            this.btn_showCert.TabIndex = 13;
            this.btn_showCert.Text = "Показать сертификат ключа";
            this.btn_showCert.UseVisualStyleBackColor = true;
            this.btn_showCert.Click += new System.EventHandler(this.btn_showCert_Click);
            // 
            // comboBox1
            // 
            this.comboBox1.FormattingEnabled = true;
            this.comboBox1.Location = new System.Drawing.Point(331, 65);
            this.comboBox1.Name = "comboBox1";
            this.comboBox1.Size = new System.Drawing.Size(291, 21);
            this.comboBox1.TabIndex = 12;
            // 
            // btn_selectcrl
            // 
            this.btn_selectcrl.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.btn_selectcrl.Location = new System.Drawing.Point(594, 40);
            this.btn_selectcrl.Name = "btn_selectcrl";
            this.btn_selectcrl.Size = new System.Drawing.Size(28, 20);
            this.btn_selectcrl.TabIndex = 11;
            this.btn_selectcrl.Text = "∙∙·";
            this.btn_selectcrl.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            this.btn_selectcrl.UseVisualStyleBackColor = true;
            this.btn_selectcrl.Click += new System.EventHandler(this.btn_selectcrl_Click);
            // 
            // tb_crl
            // 
            this.tb_crl.Location = new System.Drawing.Point(413, 40);
            this.tb_crl.Name = "tb_crl";
            this.tb_crl.Size = new System.Drawing.Size(175, 20);
            this.tb_crl.TabIndex = 10;
            // 
            // rb_crl
            // 
            this.rb_crl.Location = new System.Drawing.Point(330, 41);
            this.rb_crl.Name = "rb_crl";
            this.rb_crl.Size = new System.Drawing.Size(77, 20);
            this.rb_crl.TabIndex = 9;
            this.rb_crl.TabStop = true;
            this.rb_crl.Text = "CRL";
            this.rb_crl.UseVisualStyleBackColor = true;
            // 
            // tb_ocsp
            // 
            this.tb_ocsp.Location = new System.Drawing.Point(412, 15);
            this.tb_ocsp.Name = "tb_ocsp";
            this.tb_ocsp.Size = new System.Drawing.Size(209, 20);
            this.tb_ocsp.TabIndex = 8;
            // 
            // rb_ocsp
            // 
            this.rb_ocsp.Location = new System.Drawing.Point(330, 14);
            this.rb_ocsp.Name = "rb_ocsp";
            this.rb_ocsp.Size = new System.Drawing.Size(90, 21);
            this.rb_ocsp.TabIndex = 7;
            this.rb_ocsp.TabStop = true;
            this.rb_ocsp.Text = "OCSP URL";
            this.rb_ocsp.UseVisualStyleBackColor = true;
            // 
            // btn_selectKey
            // 
            this.btn_selectKey.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.btn_selectKey.Location = new System.Drawing.Point(281, 65);
            this.btn_selectKey.Name = "btn_selectKey";
            this.btn_selectKey.Size = new System.Drawing.Size(28, 20);
            this.btn_selectKey.TabIndex = 6;
            this.btn_selectKey.Text = "∙∙·";
            this.btn_selectKey.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            this.btn_selectKey.UseVisualStyleBackColor = true;
            this.btn_selectKey.Click += new System.EventHandler(this.btn_selectKey_Click);
            // 
            // tb_keyPath
            // 
            this.tb_keyPath.Location = new System.Drawing.Point(100, 65);
            this.tb_keyPath.Name = "tb_keyPath";
            this.tb_keyPath.Size = new System.Drawing.Size(175, 20);
            this.tb_keyPath.TabIndex = 5;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(10, 68);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(85, 13);
            this.label3.TabIndex = 4;
            this.label3.Text = "  Путь к ключу  ";
            // 
            // tb_pinCode
            // 
            this.tb_pinCode.Location = new System.Drawing.Point(100, 40);
            this.tb_pinCode.Name = "tb_pinCode";
            this.tb_pinCode.PasswordChar = '•';
            this.tb_pinCode.Size = new System.Drawing.Size(209, 20);
            this.tb_pinCode.TabIndex = 3;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(10, 45);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(85, 13);
            this.label2.TabIndex = 2;
            this.label2.Text = "      PIN код       ";
            // 
            // cbb_storeType
            // 
            this.cbb_storeType.FormattingEnabled = true;
            this.cbb_storeType.Items.AddRange(new object[] {
            "Не выбрано",
            "Файловая система - PKCS#12 (*.p12)",
            "Удостоверение личности гражданина РК (KZIDCard)",
            "Kaztoken",
            "eToken72K",
            "JaCarta",
            "Сертификат PEM (*.cer, *.crt, *.pem)",
            "aKey",
            "eToken 5110"});
            this.cbb_storeType.Location = new System.Drawing.Point(100, 15);
            this.cbb_storeType.Name = "cbb_storeType";
            this.cbb_storeType.Size = new System.Drawing.Size(209, 21);
            this.cbb_storeType.TabIndex = 1;
            // 
            // label1
            // 
            this.label1.Location = new System.Drawing.Point(10, 10);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(85, 30);
            this.label1.TabIndex = 0;
            this.label1.Text = "Тип ключевого хранилища";
            this.label1.TextAlign = System.Drawing.ContentAlignment.TopCenter;
            // 
            // tabControl1
            // 
            this.tabControl1.Controls.Add(this.tabPage1);
            this.tabControl1.Controls.Add(this.tabPage2);
            this.tabControl1.Location = new System.Drawing.Point(1, 1);
            this.tabControl1.Name = "tabControl1";
            this.tabControl1.SelectedIndex = 0;
            this.tabControl1.Size = new System.Drawing.Size(932, 809);
            this.tabControl1.TabIndex = 0;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.panel1);
            this.tabPage2.Location = new System.Drawing.Point(4, 22);
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage2.Size = new System.Drawing.Size(922, 778);
            this.tabPage2.TabIndex = 1;
            this.tabPage2.Text = "Настройки";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // panel1
            // 
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panel1.Controls.Add(this.button1);
            this.panel1.Controls.Add(this.tb_pass);
            this.panel1.Controls.Add(this.tb_login);
            this.panel1.Controls.Add(this.tb_port);
            this.panel1.Controls.Add(this.tb_addr);
            this.panel1.Controls.Add(this.checkBox1);
            this.panel1.Controls.Add(this.label10);
            this.panel1.Controls.Add(this.label9);
            this.panel1.Controls.Add(this.label8);
            this.panel1.Controls.Add(this.label7);
            this.panel1.Controls.Add(this.label6);
            this.panel1.Location = new System.Drawing.Point(7, 6);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(363, 278);
            this.panel1.TabIndex = 0;
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(255, 223);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(75, 23);
            this.button1.TabIndex = 11;
            this.button1.Text = "Сохранить";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // tb_pass
            // 
            this.tb_pass.Enabled = false;
            this.tb_pass.Location = new System.Drawing.Point(70, 162);
            this.tb_pass.Name = "tb_pass";
            this.tb_pass.PasswordChar = '*';
            this.tb_pass.Size = new System.Drawing.Size(260, 20);
            this.tb_pass.TabIndex = 10;
            // 
            // tb_login
            // 
            this.tb_login.Enabled = false;
            this.tb_login.Location = new System.Drawing.Point(70, 130);
            this.tb_login.Name = "tb_login";
            this.tb_login.Size = new System.Drawing.Size(260, 20);
            this.tb_login.TabIndex = 9;
            // 
            // tb_port
            // 
            this.tb_port.Location = new System.Drawing.Point(70, 67);
            this.tb_port.Name = "tb_port";
            this.tb_port.Size = new System.Drawing.Size(260, 20);
            this.tb_port.TabIndex = 7;
            this.tb_port.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.tb_port_KeyPress);
            // 
            // tb_addr
            // 
            this.tb_addr.Location = new System.Drawing.Point(70, 40);
            this.tb_addr.Name = "tb_addr";
            this.tb_addr.Size = new System.Drawing.Size(260, 20);
            this.tb_addr.TabIndex = 6;
            // 
            // checkBox1
            // 
            this.checkBox1.AutoSize = true;
            this.checkBox1.Location = new System.Drawing.Point(17, 103);
            this.checkBox1.Name = "checkBox1";
            this.checkBox1.Size = new System.Drawing.Size(213, 17);
            this.checkBox1.TabIndex = 8;
            this.checkBox1.Text = "Прокси-сервер требует авторизации";
            this.checkBox1.UseVisualStyleBackColor = true;
            this.checkBox1.CheckedChanged += new System.EventHandler(this.checkBox1_CheckedChanged);
            // 
            // label10
            // 
            this.label10.AutoSize = true;
            this.label10.Location = new System.Drawing.Point(14, 165);
            this.label10.Name = "label10";
            this.label10.Size = new System.Drawing.Size(45, 13);
            this.label10.TabIndex = 4;
            this.label10.Text = "Пароль";
            // 
            // label9
            // 
            this.label9.AutoSize = true;
            this.label9.Location = new System.Drawing.Point(14, 133);
            this.label9.Name = "label9";
            this.label9.Size = new System.Drawing.Size(38, 13);
            this.label9.TabIndex = 3;
            this.label9.Text = "Логин";
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Location = new System.Drawing.Point(14, 70);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(32, 13);
            this.label8.TabIndex = 2;
            this.label8.Text = "Порт";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(14, 43);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(38, 13);
            this.label7.TabIndex = 1;
            this.label7.Text = "Адрес";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(14, 9);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(101, 13);
            this.label6.TabIndex = 0;
            this.label6.Text = "Настройки прокси";
            // 
            // openFileDialogCRL
            // 
            this.openFileDialogCRL.Title = "Выберите CRL файл";
            // 
            // cb_getResp
            // 
            this.cb_getResp.AutoSize = true;
            this.cb_getResp.Location = new System.Drawing.Point(6, 88);
            this.cb_getResp.Name = "cb_getResp";
            this.cb_getResp.Size = new System.Drawing.Size(155, 17);
            this.cb_getResp.TabIndex = 44;
            this.cb_getResp.Text = "Вывести OCSP - responce";
            this.cb_getResp.UseVisualStyleBackColor = true;
            this.cb_getResp.CheckedChanged += new System.EventHandler(this.cb_getResp_CheckedChanged);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(929, 806);
            this.Controls.Add(this.tabControl1);
            this.Name = "Form1";
            this.Text = "KNCA © Kalkan Crypt Test Project";
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.groupBox4.ResumeLayout(false);
            this.groupBox4.PerformLayout();
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.groupBox3.ResumeLayout(false);
            this.groupBox3.PerformLayout();
            this.tabControl1.ResumeLayout(false);
            this.tabPage2.ResumeLayout(false);
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.TabControl tabControl1;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox tb_pinCode;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.ComboBox cbb_storeType;
        private System.Windows.Forms.RadioButton rb_ocsp;
        private System.Windows.Forms.Button btn_selectKey;
        private System.Windows.Forms.TextBox tb_keyPath;
        private System.Windows.Forms.OpenFileDialog openFileDialogKeyPath;
        private System.Windows.Forms.Button btn_showCert;
        private System.Windows.Forms.ComboBox comboBox1;
        private System.Windows.Forms.Button btn_selectcrl;
        private System.Windows.Forms.TextBox tb_crl;
        private System.Windows.Forms.RadioButton rb_crl;
        private System.Windows.Forms.TextBox tb_ocsp;
        private System.Windows.Forms.Button btn_verifyXML;
        private System.Windows.Forms.Button btn_signXML;
        private System.Windows.Forms.Button btn_verifyData;
        private System.Windows.Forms.Button btn_signData;
        private System.Windows.Forms.Button btn_infoCert;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Button btn_getCertFromXML;
        private System.Windows.Forms.OpenFileDialog openFileDialogCRL;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Button btn_verifyFile;
        private System.Windows.Forms.Button btn_signFile;
        private System.Windows.Forms.Button btn_checkCert;
        private System.Windows.Forms.TextBox tb_signID;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.CheckBox cb_in2Base64;
        private System.Windows.Forms.RadioButton rb_inDER;
        private System.Windows.Forms.RadioButton rb_inPEM;
        private System.Windows.Forms.RadioButton rb_inBase64;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.RadioButton rb_outDER;
        private System.Windows.Forms.RadioButton rb_outPEM;
        private System.Windows.Forms.RadioButton rb_outBase64;
        private System.Windows.Forms.TextBox textBox8;
        private System.Windows.Forms.TextBox textBox7;
        private System.Windows.Forms.TextBox textBox6;
        private System.Windows.Forms.Button btn_vfyZip;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.CheckBox cb_addTimeStamp;
        private System.Windows.Forms.CheckBox cb_detachedSign;
        private System.Windows.Forms.CheckBox cb_draftData;
        private System.Windows.Forms.Button btn_cleanForm;
        private System.Windows.Forms.Button btn_signHashData;
        private System.Windows.Forms.Button btn_hashData;
        private System.Windows.Forms.Button btn_GetTimeFromSig;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.TextBox tb_pass;
        private System.Windows.Forms.TextBox tb_login;
        private System.Windows.Forms.TextBox tb_port;
        private System.Windows.Forms.TextBox tb_addr;
        private System.Windows.Forms.CheckBox checkBox1;
        private System.Windows.Forms.Label label10;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Button btn_GetCertFromCMS;
        private System.Windows.Forms.Button btn_signwsse;
        private System.Windows.Forms.Button btn_hashFile;
        private System.Windows.Forms.Button btn_signzip;
        private System.Windows.Forms.CheckBox cb_inFile;
        private System.Windows.Forms.CheckBox cb_verifyCert;
        private System.Windows.Forms.RadioButton rb_gost;
        private System.Windows.Forms.RadioButton rb_sha;
        private System.Windows.Forms.GroupBox groupBox4;
        private System.Windows.Forms.Button getCertFromZIP;
        private System.Windows.Forms.CheckBox cb_getResp;
    }
}

