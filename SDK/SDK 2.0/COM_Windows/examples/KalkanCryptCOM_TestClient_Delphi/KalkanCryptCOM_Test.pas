unit KalkanCryptCOM_Test;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.IOUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls, Vcl.ExtCtrls, Vcl.ComCtrls, KalkanCryptCOM_TLB, ActiveX, Math, DateUtils;

const
  cBase64Codec: array[0..63] of AnsiChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  Base64Filler: AnsiChar = '=';

type
  TForm1 = class(TForm)
    pgc1: TPageControl;
    ts1: TTabSheet;
    lbl1: TLabel;
    lbl2: TLabel;
    lbl4: TLabel;
    btnVerifyXML: TButton;
    btnSignXML: TButton;
    edtKeyPath: TEdit;
    btnSelectKey: TButton;
    redt_SignedData: TRichEdit;
    redt_data: TRichEdit;
    edt_pincode: TEdit;
    btn_GetCert: TButton;
    btn_SignData: TButton;
    btn_CertInfo: TButton;
    btn_VerifyData: TButton;
    cbb_StoreType: TComboBox;
    grp1: TGroupBox;
    cb_WithTimestamp: TCheckBox;
    cb_DraftData: TCheckBox;
    cb_Detached: TCheckBox;
    btn_CheckDoc: TButton;
    Panel1: TPanel;
    edt2: TEdit;
    RadioButton2: TRadioButton;
    Button2: TButton;
    RichEdit1: TRichEdit;
    OpenDialog1: TOpenDialog;
    GroupBox1: TGroupBox;
    GroupBox2: TGroupBox;
    Label1: TLabel;
    rb_inbase64: TRadioButton;
    rb_inpem: TRadioButton;
    rb_inder: TRadioButton;
    cb_in2base64: TCheckBox;
    rb_outder: TRadioButton;
    rb_outpem: TRadioButton;
    rb_outbase64: TRadioButton;
    btn_SignFile: TButton;
    OpenDialog2: TOpenDialog;
    btn_VerifyFile: TButton;
    btn_getcertfromxml: TButton;
    Edit2: TEdit;
    Label2: TLabel;
    Button1: TButton;
    RadioButton1: TRadioButton;
    edt1: TEdit;
    Button3: TButton;
    btn_GetTimeFromCMS: TButton;
    TabSheet1: TTabSheet;
    Panel2: TPanel;
    Label3: TLabel;
    Label4: TLabel;
    Label5: TLabel;
    Label6: TLabel;
    Label7: TLabel;
    Edit_addr: TEdit;
    Edit_port: TEdit;
    Edit_login: TEdit;
    Edit_psw: TEdit;
    Button4: TButton;
    CheckBox1: TCheckBox;
    btn_GetCertFromCMS: TButton;
    Button5: TButton;
    rb_sha256: TRadioButton;
    rb_gost34311_95: TRadioButton;
    btn_SignHash: TButton;
    ChooseFile: TOpenDialog;
    btn_HashFile: TButton;
    ChooseFileForSign: TOpenDialog;
    btnSignWSSE: TButton;
    btn_GetCertFromZIP: TButton;
    btnSignZip: TButton;
    btnVerifyZip: TButton;
    cb_verifyCert: TCheckBox;
    cb_getResp: TCheckBox;
    cb_inFile: TCheckBox;
    ComboBox1: TComboBox;
    procedure FormCreate(Sender: TObject);
    procedure btnSelectKeyClick(Sender: TObject);
    procedure btn_GetCertClick(Sender: TObject);
    procedure btn_CertInfoClick(Sender: TObject);
    procedure btnSignXMLClick(Sender: TObject);
    procedure btnVerifyXMLClick(Sender: TObject);
    procedure btn_SignDataClick(Sender: TObject);
    procedure btn_VerifyDataClick(Sender: TObject);
    procedure KC_Flags_Click(Sender: TObject);
    procedure btn_SignFileClick(Sender: TObject);
    procedure btn_VerifyFileClick(Sender: TObject);
    procedure btn_getcertfromxmlClick(Sender: TObject);
    procedure btn_CheckDocClick(Sender: TObject);
    procedure Button2Click(Sender: TObject);
    procedure Button1Click(Sender: TObject);
    procedure FormClose(Sender: TObject; var Action: TCloseAction);
    procedure Button3Click(Sender: TObject);
    procedure btn_GetTimeFromCMSClick(Sender: TObject);
    procedure CheckBox1Click(Sender: TObject);
    procedure Edit_portKeyPress(Sender: TObject; var Key: Char);
    procedure Button4Click(Sender: TObject);
    procedure btn_GetCertFromCMSClick(Sender: TObject);
    procedure btn_HashDataClick(Sender: TObject);
    procedure btn_SignHashClick(Sender: TObject);
    procedure btn_HashFileClick(Sender: TObject);
    procedure btnSignWSSEClick(Sender: TObject);
    procedure btnSignZipClick(Sender: TObject);
    procedure btnVerifyZipClick(Sender: TObject);
    procedure btn_GetCertFromZIPClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  Form1: TForm1;
  KalkanCOMTest: IKalkanCryptCOM;
  KalkanFlags: Integer;

type
  TAByte = array[0..MaxInt - 1] of Byte;
  TPAByte = ^TAByte;

  function CalcEncodedSize(InSize: DWord): DWord;
  function CalcDecodedSize(const InBuffer; InSize: DWord): DWord;

implementation

{$R *.dfm}

function CalcEncodedSize(InSize: DWord): DWord;
begin
  // no buffers passed along, calculate outbuffer size needed
  Result := (InSize div 3) shl 2;
  if (InSize mod 3) > 0 then
    Inc(Result, 4);
end;

function CalcDecodedSize(const InBuffer; InSize: DWord): DWord;
begin
  Result := 0;
  if InSize = 0 then
    Exit;
  if (InSize mod 4 <> 0) then
    Exit;

  Result := InSize div 4 * 3;
  if (PByte(DWord(InBuffer) + InSize - 2)^ = Ord(Base64Filler)) then
    Dec(Result, 2)
  else
  if (PByte(DWord(InBuffer) + InSize - 1)^ = Ord(Base64Filler)) then
    Dec(Result);
end;




procedure TForm1.btnSelectKeyClick(Sender: TObject);
var
rv: HRESULT;
ret_err: LongWord;
pin, containerName: WideString;
errStr: WideString;
tokens, certAliases: WideString;
storage, tCount, certCount, tmpPos: Integer;
begin
  if (cbb_StoreType.ItemIndex = -1) then
    Application.MessageBox('Не выбран тип ключевого хранилища!','Ошибка', MB_ICONERROR + MB_OK)
  else
    case cbb_StoreType.ItemIndex of
      0: //PKCS#12
      begin
        if Form1.edt_pincode.Text = '' then
          begin
            Application.MessageBox('Не указан пароль к хранилищу!','Ошибка', MB_ICONERROR + MB_OK);
            Exit;
          end;
        OpenDialog1.Title := 'Select a PKCS#12 File';
        OpenDialog1.Filter := 'PKCS#12 File|*.p12';
        if (OpenDialog1.Execute(Form1.Handle)) then
          begin
            try
              pin := SySAllocString(PWideChar(edt_pincode.Text));
              containerName := SysAllocString(PWideChar(OpenDialog1.FileName));
              rv := KalkanCOMTest.LoadKeyStore(KCST_PKCS12, pin, containerName, '');
              if (rv > 0) then
              begin
                KalkanCOMTest.GetLastError(ret_err);
                RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
                Exit;
              end;
              edtKeyPath.Text := OpenDialog1.FileName;
            finally
              SysFreeString(PWideChar(pin));
              SysFreeString(PWideChar(containerName));
            end;

          end;
      end;
      1..4,6: // KZIdCerd, Kaztoken, EToken72K, JaCarta
      begin
      if cbb_StoreType.ItemIndex = 1 then
        storage := KCST_KZIDCARD
        else if cbb_StoreType.ItemIndex = 2 then
          storage := KCST_KAZTOKEN
             else if cbb_StoreType.ItemIndex = 3 then
                storage := KCST_ETOKEN72K
                  else if cbb_StoreType.ItemIndex = 4 then
                      storage := KCST_JACARTA
                        else if cbb_StoreType.ItemIndex = 6 then
                          storage := KCST_AKEY;

        tokens := '';
        tCount := 0;
        rv := KalkanCOMTest.GetTokens(storage, tokens, tCount);

        if tCount = 0 then
          begin
            Application.MessageBox('Нет подключенных устройств!','Ошибка', MB_ICONERROR + MB_OK);
            Exit;
          end
        else
          {* Если подключено несколько одинаковых токенов (например, два казтокена),
           * то в tokens перечислены все эти устройства через разделитель ; (точка с запятой)
           * В данном случае, простой пример с одним утройством.
          *}
        edtKeyPath.Text := tokens;
        pin := SySAllocString(PWideChar(edt_pincode.Text));
        containerName := SysAllocString(PWideChar(edtKeyPath.Text));
        rv := KalkanCOMTest.LoadKeyStore(storage, pin, containerName, '');
        if (rv > 0) then
          begin
            //KalkanCOMTest.GetLastError(ret_err);
            KalkanCOMTest.GetLastErrorString(errStr, ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + ' ';
            RichEdit1.Text := RichEdit1.Text + errStr;
            Exit;
          end;
        rv := KalkanComTest.GetCertAliases(certAliases, certCount);
        if (rv > 0) then
          begin
            KalkanCOMTest.GetLastError(ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
            //KalkanCOMTest.GetLastErrorString(errStr, rv);
            RichEdit1.Text := RichEdit1.Text + errStr;
            Exit;
          end;
        ComboBox1.Items.Clear;
        if (certCount > 0) then
        begin
          {if (certCount = 1) then
          begin
            ComboBox1.Items.Add(certAliases);
          end
          else
          begin }
            while (Length(certAliases) > 0) do
            begin
              tmpPos := Pos(';', certAliases);
              if (tmpPos = 0) then
                tmpPos := Length(certAliases) + 1;
              ComboBox1.Items.Add(Copy(certAliases, 1, tmpPos-1));
              Delete(certAliases, 1, tmpPos);
            end;


          //end;

        end;


      end;
      5: //Сертификат PEM (*.cer, *.crt, *.pem)
      begin
        OpenDialog1.Title := 'Select a Certificate File';
        OpenDialog1.Filter := 'Certificate File|*.cer;*.crt;*.pem';
        if (OpenDialog1.Execute(Form1.Handle)) then
          begin
            rv := KalkanCOMTest.X509LoadCertificateFromFile(OpenDialog1.FileName, KC_CERT_USER);
            if (rv > 0) then
              begin
                KalkanCOMTest.GetLastError(ret_err);
                RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
                KalkanCOMTest.GetLastErrorString(errStr, ret_err);
                RichEdit1.Text := RichEdit1.Text + errStr;
                Exit;
              end;
            edtKeyPath.Text := OpenDialog1.FileName;

          end;
      end;
    end;
    //SysFreeString(PWideChar(pin));
    //SysFreeString(PWideChar(containerName));
    //SysFreeString(PWideChar(certAliases));
    certAliases := '';
end;

procedure TForm1.btnSignWSSEClick(Sender: TObject);
var
inDataXML, outSign, alias, inFiles, zipName, outDir, inSign, outData, outVerifyInfo, outCert: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
rv: HRESULT;
err_str: WideString;
ret_err: LongWord;
xml_flags, flags, inCertID, inDataLength: Integer;
inData :Byte;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  try
  inDataXML := SysAllocString(PWideChar(redt_data.Text));
  //inData := '';
  signNodeId := '';
  alias := SysAllocString(PWideChar(ComboBox1.Items[ComboBox1.ItemIndex]));
  //alias := '';
  xml_flags := 0;
  flags := 0;
  outSign := '';

  rv := KalkanCOMTest.SignWSSE(alias, xml_flags, inDataXML, signNodeId, outSign);
  //rv := KalkanCOMTest.VerifyDataBytes (alias, flags, inCertID, inData, inDataLength, inSign, outData, outVerifyInfo, outCert);
  inFiles := 'D:\testfiledir\';
  zipName := 'zipFile';
  outDir := 'D:\test\';
;
  //rv := KalkanCOMTest.ZipConSign(alias, inFiles, zipName, outDir, flags);
  if (rv > 0) then
    begin
      KalkanCOMTest.GetLastErrorString(err_str, ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + #13 + err_str;
      Exit;
    end;
  redt_SignedData.Text := outSign;
  finally
//    if inData <> '' then
//        SysFreeString(PWideChar(inData));
    if outSign <> '' then
        SysFreeString(PWideChar(outSign));
    if alias <> '' then
        SysFreeString(PWideChar(alias));
    if signNodeId <> '' then
        SysFreeString(PWideChar(signNodeId));

    // KalkanCOMTest.XMLFinalize(); - Не надо вызывать каждый раз при подписи.
    // Можно только один раз после цикла подписания xml файлов.
    KalkanCOMTest.XMLFinalize();
  end;
end;

procedure TForm1.btnSignXMLClick(Sender: TObject);
var
inData, outSign, alias: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
rv: HRESULT;
err_str: WideString;
ret_err: LongWord;
xml_flags: Integer;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  try
    // signNodeId - идентификатор тэга, который необходимо подписать.
    // Не указывается, если необходимо подписать все содержимое документа;
    signNodeId := #0; //'4aac65a3-28ab-49aa-857d-cb4e028594e1'
    // parentSignNode - идентификатор тэга, в который необходимо поместить значение подписи;
    parentSignNode := #0; //'Header';
    // parentNameSpace -  пространство имен тэга, в который необходимо поместить значение подписи.
    // Если пространство имен есть,  но не будет указано - то тег не найдется
    parentNameSpace := #0; //'http://schemas.xmlsoap.org/soap/envelope/';

    inData := SysAllocString(PWideChar(redt_data.Text));
    alias := SysAllocString(PWideChar(ComboBox1.Items[ComboBox1.ItemIndex]));

    xml_flags := 0;
    //xml_flags := KC_XML_EXCL_C14N;

    rv := KalkanCOMTest.SignXML(alias, xml_flags, signNodeId, parentSignNode, parentNameSpace, inData, outSign);
    if (rv > 0) then
    begin
      KalkanCOMTest.GetLastErrorString(err_str, ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + #13 + err_str;
      Exit;
    end;
    redt_SignedData.Text := outSign;
  finally
    if inData <> '' then
        SysFreeString(PWideChar(inData));
    if outSign <> '' then
        SysFreeString(PWideChar(outSign));
    if alias <> '' then
        SysFreeString(PWideChar(alias));
    // KalkanCOMTest.XMLFinalize(); - Не надо вызывать каждый раз при подписи.
    // Можно только один раз после цикла подписания xml файлов.
    KalkanCOMTest.XMLFinalize();
  end;
end;

procedure TForm1.btnSignZipClick(Sender: TObject);
var
alias, zipName, outDir, fileNames: WideString;
files: array[0..100] of WideString;
err_str: WideString;
rv: HRESULT;
ret_err: LongWord;
FileNameList: TStrings;
OpenDialog: TFileOpenDialog;
i : integer;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  ChooseFile.Title := 'Select a Files for zip signing';
  ChooseFile.Options := [ofAllowMultiSelect];
  if (ChooseFile.Execute(Form1.Handle)) then
  begin
      if (ChooseFile.Files[0] = '') then
        begin
          Application.MessageBox('Нет данных для подписи!', 'Ошибка', MB_ICONERROR + MB_OK);
          Exit;
      end;
      try
        OpenDialog := TFileOpenDialog.Create(Form1);
        try
          OpenDialog.Options := OpenDialog.Options + [fdoPickFolders];
          if not OpenDialog.Execute then
            Abort;
          outDir := OpenDialog.FileName;
          alias := SysAllocString(PWideChar(ComboBox1.Items[ComboBox1.ItemIndex]));
          zipName := redt_data.Text;
          fileNames := '';
          for i := 0 to  ChooseFile.Files.Count - 1 do
          begin
              fileNames := fileNames + ChooseFile.Files[i] + '|';
          end;
          //redt_SignedData.Text :=  fileNames;
          rv := KalkanCOMTest.ZipConSign(alias, fileNames, zipName, outDir, kalkanFlags);
          if (rv > 0) then
          begin
            KalkanCOMTest.GetLastErrorString(err_str, ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
            Exit;
          end;
        finally
          OpenDialog.Free;
        end;
      finally
      end;
  end;
end;

procedure TForm1.btnVerifyXMLClick(Sender: TObject);
var
inData, inData2, outVerifyInfo, outData: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
errorString: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
  if (redt_SignedData.Text = '') then
  begin
    Application.MessageBox('Нет XML!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;

  try
    ret_err := 0;
    inData := SysAllocString(PWideChar(redt_SignedData.Text));


    //verify xml
    inData2 := SysAllocString(PWideChar(redt_SignedData.Text));
    rv := KalkanCOMTest.VerifyXML('', 0, inData2, outVerifyInfo);
    if (rv > 0) then
    begin
      KalkanCOMTest.GetLastErrorString(errorString, ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13;
      RichEdit1.Text := RichEdit1.Text + outVerifyInfo;
      RichEdit1.Text := RichEdit1.Text + #13 + #13 + errorString;
      Exit;
    end;
    RichEdit1.Text := outVerifyInfo;
  finally
    if inData <> '' then
      SysFreeString(PWideChar(inData));
    if inData2 <> '' then
      SysFreeString(PWideChar(inData2));
    if outVerifyInfo <> '' then
      SysFreeString(PWideChar(outVerifyInfo));
  end;
end;

procedure TForm1.btnVerifyZipClick(Sender: TObject);
var
outInfo, filePath: WideString;
err_str: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
  ChooseFile.Title := 'Select a File for verify';
  if (ChooseFile.Execute(Form1.Handle)) then
  begin
      if (ChooseFile.FileName = '') then
        begin
          Application.MessageBox('Нет данных для проверки!', 'Ошибка', MB_ICONERROR + MB_OK);
          Exit;
      end;
      try
        filePath := ChooseFile.FileName;
        rv := KalkanCOMTest.ZipConVerify(filePath, kalkanFlags, outInfo);
        if (rv > 0) then
          begin
            KalkanCOMTest.GetLastErrorString(err_str, ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
            Exit;
          end;
          redt_SignedData.Text := outInfo;
      finally
        if (outInfo <> '') then
          SysFreeString(PWideChar(outInfo));
      end;
  end;
end;

procedure TForm1.btn_CertInfoClick(Sender: TObject);
var
rv: HRESULT;
cert, outData: WideString;
ret_err: LongWord;
begin
//  if (edtKeyPath.Text = '') then
//  begin
//    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
//    Exit;
//  end;

  if redt_data.Text = '' then
  begin
    Application.MessageBox('Не указан сертификат!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;

  try
//    rv := KalkanCOMTest.X509ExportCertificateFromStore('', KC_OUT_BASE64, cert);
//    if (rv > 0) then
//      begin
//        KalkanCOMTest.GetLastError(ret_err);
//        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
//        Exit;
//      end;

    cert := redt_data.Text;
    redt_SignedData.Text := 'ISSUER' + #13;
    //KC_CERTPROP_ISSUER_COUNTRYNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_COUNTRYNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_ISSUER_SOPN
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_SOPN, outData);
        if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_ISSUER_LOCALITYNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_LOCALITYNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_ISSUER_ORG_NAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_ORG_NAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_ISSUER_ORGUNIT_NAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_ORGUNIT_NAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_ISSUER_COMMONNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_ISSUER_COMMONNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    redt_SignedData.Text := redt_SignedData.Text + #13 + 'SUBJECT' + #13;

    //KC_CERTPROP_SUBJECT_COUNTRYNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_COUNTRYNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_SOPN
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_SOPN, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_LOCALITYNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_LOCALITYNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_COMMONNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_COMMONNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_GIVENNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_GIVENNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_SURNAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_SURNAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_SERIALNUMBER
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_SERIALNUMBER, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_EMAIL
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_EMAIL, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_ORG_NAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_ORG_NAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_ORGUNIT_NAME
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_ORGUNIT_NAME, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_BC
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_BC, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJECT_DC
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJECT_DC, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    redt_SignedData.Text := redt_SignedData.Text + #13;

    //KC_CERTPROP_NOTBEFORE
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_NOTBEFORE, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_NOTAFTER
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_NOTAFTER, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_KEY_USAGE
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_KEY_USAGE, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_EXT_KEY_USAGE
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_EXT_KEY_USAGE, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_AUTH_KEY_ID
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_AUTH_KEY_ID, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SUBJ_KEY_ID
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SUBJ_KEY_ID, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_CERT_SN
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_CERT_SN, outData);
    if (rv = 0) then
    begin
      //Delete(outData, 1, 24);
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_SIGNATURE_ALG
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_SIGNATURE_ALG, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_PUBKEY
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_PUBKEY, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_OCSP
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_OCSP, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_GET_CRL
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_GET_CRL, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;

    //KC_CERTPROP_GET_DELTA_CRL
    rv := KalkanCOMTest.X509CertificateGetInfo(cert, KC_CERTPROP_GET_DELTA_CRL, outData);
    if (rv = 0) then
    begin
      redt_SignedData.Text := redt_SignedData.Text + outData + #13;
    end;



  finally
    if outData <> '' then
      SysFreeString(PWideChar(outData));
  end;

end;

procedure TForm1.btn_CheckDocClick(Sender: TObject);
var
rv: HRESULT;
inCert, validPath, outInfo: WideString;
validType: Integer;
ret_err: LongWord;
  i: Integer;
begin
  inCert := redt_data.Text;
  if (RadioButton1.Checked) then
    begin
      validType := KC_USE_OCSP;
      validPath := edt1.Text;
    end
  else if (RadioButton2.Checked) then
    begin
      validType := KC_USE_CRL;
      validPath := edt2.Text;
    end;

  try
    //KalkanCOMTest.X509LoadCertificateFromFile('..\..\cacerts\root_rsa.crt', KC_CERT_CA);
    //KalkanCOMTest.X509LoadCertificateFromFile('..\..\cacerts\pki_rsa.crt', KC_CERT_INTERMEDIATE);
    //for i := 1 to 1000 do
    begin
      rv := KalkanCOMTest.X509ValidateCertificate(inCert, validType, validPath, 0, outInfo);
    end;

    if (rv > 0) then
      begin
        KalkanCOMTest.GetLastError(ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
        RichEdit1.Text := RichEdit1.Text + #13 + outInfo;
        Exit;
      end;
    RichEdit1.Text := outInfo;
  finally
    if outInfo <> '' then
      SysFreeString(PWideChar(outInfo));  //Освободим память
  end;




end;

procedure TForm1.btn_GetCertClick(Sender: TObject);
var
rv: HRESULT;
alias, outCert, errStr: WideString;
ret_err: LongWord;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;

  try
    alias := SysAllocString(PWideChar(ComboBox1.Items[ComboBox1.ItemIndex]));
    //KC_OUT_BASE64
    rv := KalkanCOMTest.X509ExportCertificateFromStore(alias, KalkanFlags, outCert);
    //rv := KalkanCOMTest.X509ExportCertificateFromStore(ComboBox1.Items[ComboBox1.ItemIndex], KalkanFlags, outCert);
    if (rv > 0) then
      begin
        KalkanCOMTest.GetLastError(ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
        KalkanCOMTest.GetLastErrorString(errStr, ret_err);
        RichEdit1.Text := RichEdit1.Text + errStr;
        Exit;
      end;
    redt_Data.Text := WideString(outCert);

  finally
    if outCert <> '' then
      SysFreeString(PWideChar(outCert));  //Освободим память
    if alias <> '' then
      SysFreeString(PWideChar(alias));
  end;

end;



procedure TForm1.btn_GetCertFromCMSClick(Sender: TObject);
var
inCMS, outCert: WideString;
signID: Integer;
rv: HRESULT;
ret_err: LongWord;

begin
if (redt_SignedData.Text = '') then
begin
  Application.MessageBox('Нет CMS!', 'Ошибка', MB_ICONERROR + MB_OK);
  Exit;
end;


try

  inCMS := SysAllocString(PWideChar(redt_SignedData.Text));
  signID := StrToInt(Edit2.Text);

  rv := KalkanCOMTest.GetCertFromCMS( inCMS, KalkanFlags, signID, outCert);

  if (rv > 0) then
      begin
        KalkanCOMTest.GetLastError(ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
        Exit;
      end;
  redt_data.Text := outCert;

finally
  if inCMS <> '' then
    SysFreeString(PWideChar(inCMS));
  if outCert <> '' then
    SysFreeString(PWideChar(outCert));
end;
end;

procedure TForm1.btn_getcertfromxmlClick(Sender: TObject);
var
inXML, outCert: WideString;
signID: Integer;
rv: HRESULT;
ret_err: LongWord;
begin
if (redt_SignedData.Text = '') then
begin
  Application.MessageBox('Нет XML!', 'Ошибка', MB_ICONERROR + MB_OK);
  Exit;
end;


try

  inXML := SysAllocString(PWideChar(redt_SignedData.Text));
  signID := StrToInt(Edit2.Text);

  rv := KalkanCOMTest.GetCertFromXML(inXML,  signID, outCert);

  if (rv > 0) then
      begin
        KalkanCOMTest.GetLastError(ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
        Exit;
      end;
  redt_data.Text := outCert;

finally
  if inXML <> '' then
    SysFreeString(PWideChar(inXML));
  if outCert <> '' then
    SysFreeString(PWideChar(outCert));
end;

end;

procedure TForm1.btn_GetCertFromZIPClick(Sender: TObject);
var
outInfo, filePath, outCert: WideString;
err_str: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
  ChooseFile.Title := 'Select a File for getting a cert';
  if (ChooseFile.Execute(Form1.Handle)) then
  begin
      if (ChooseFile.FileName = '') then
        begin
          Application.MessageBox('Нет данных!', 'Ошибка', MB_ICONERROR + MB_OK);
          Exit;
      end;
      try
        filePath := ChooseFile.FileName;
        //rv := KalkanCOMTest.ZipConVerify(filePath, kalkanFlags, outInfo);
        rv := KalkanCOMTest.GetCertFromZIP(filePath, kalkanFlags, Int32.Parse(Edit2.Text), outCert);
        if (rv > 0) then
          begin
            KalkanCOMTest.GetLastErrorString(err_str, ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
            Exit;
          end;
          redt_SignedData.Text := outCert;
      finally
        if (outInfo <> '') then
          SysFreeString(PWideChar(outInfo));
      end;
  end;
end;

procedure TForm1.btn_GetTimeFromCMSClick(Sender: TObject);
var
  inData, errStr, dateTime: WideString;
  rv: HRESULT;
  ret_err: LongWord;
  outDateTime: Int64;
  //tmpDate: TDateTime;
begin
   inData := SysAllocString(PWideChar(redt_SignedData.Text));

   rv := KalkanCOMTest.TSAGetTimeFromSig(inData, KalkanFlags, 0, outDateTime);
   if (rv > 0) then
   begin
     KalkanCOMTest.GetLastErrorString(errStr, ret_err);
     RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + #13 + errStr;
     Exit;
   end;

   { Время возвращается в Unix формате (от 01/01/1970), добавим 25569 (для отсчета от 01/01/1900)
     Добавим время часовго пояса Алматы +6.00 (6/24)
   }
   dateTime := DateTimeToStr((outDateTime / 86400) + 25569.0 + 6/24 );
   RichEdit1.Text := 'Signature time: ' + dateTime;


end;


procedure TForm1.btn_SignDataClick(Sender: TObject);
var
inData, outSign: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
rv: HRESULT;
err_str: WideString;
ret_err: LongWord;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  try

    inData := SysAllocString(PWideChar(redt_data.Text));
    if (((KalkanFlags and KC_SIGN_CMS) = KC_SIGN_CMS) and ((KalkanFlags and KC_WITH_TIMESTAMP) = KC_WITH_TIMESTAMP)) then
    begin
      KalkanCOMTest.TSASetUrl('http://tsp.pki.gov.kz:80');
    end;

    //---CMS Sign---
    // KC_SIGN_CMS or KC_OUT_PEM
    //---Draft Sign---
    // KC_SIGN_DRAFT or KC_OUT_BASE64
    rv := KalkanCOMTest.SignData(ComboBox1.Items[ComboBox1.ItemIndex], KalkanFlags, inData, outSign);
    if (rv > 0) then
    begin
      KalkanCOMTest.GetLastErrorString(err_str, ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
      //Exit;
    end;
    redt_SignedData.Text := outSign;
  finally
    if (inData <> '') then
      SysFreeString(PWideChar(inData));
    if (outSign <> '') then
        SysFreeString(PWideChar(outSign));
  end;

end;

procedure TForm1.btn_SignFileClick(Sender: TObject);
var
tmpStr, outSign: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
inData: TBytes;
rv: HRESULT;
ret_err: LongWord;
AnotherFlag: Integer;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  try
    ChooseFileForSign.Title := 'Select a File for signing';
    if (ChooseFileForSign.Execute(Form1.Handle)) then
      begin
        if (ChooseFileForSign.FileName = '') then
        begin
          Application.MessageBox('Нет данных для подписи!', 'Ошибка', MB_ICONERROR + MB_OK);
          Exit;
        end;
        inData := TFile.ReadAllBytes(ChooseFileForSign.FileName);
        rv := KalkanCOMTest.SignDataBytes('', kalkanFlags, inData[1], Length(inData), outSign);
        if (rv > 0) then
          begin
            KalkanCOMTest.GetLastError(ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8);
            Exit;
          end;
        redt_SignedData.Text := outSign;
      end;
  finally
    if (outSign <> '') then
      SysFreeString(PWideChar(outSign));
  end;
end;

procedure TForm1.btn_VerifyDataClick(Sender: TObject);
var
inData, outVerifyInfo, outData, inSign, outCert, errStr: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
RichEdit1.Perform(EM_LIMITTEXT, 10000000, 0);
RichEdit1.MaxLength := 10000000;
  try
    inData := '';
    outVerifyInfo := '';
    outData := '';
    inSign := '';
    outCert := '';
    ret_err := 0;
    inData := SysAllocString(PWideChar(redt_data.Text));
    inSign := SysAllocString(PWideChar(redt_SignedData.Text));
    //---Verify CMS Sign---
    // KC_SIGN_CMS or KC_IN_PEM
    rv := KalkanCOMTest.VerifyData('', KC_SIGN_CMS or KalkanFlags, 1, inData, inSign, outData, outVerifyInfo, outCert);
    //---Verify Draft Sign---
    // KC_SIGN_DRAFT or KC_IN2_BASE64
    //rv := KalkanCOMTest.VerifyData('', KC_SIGN_CMS or KalkanFlags, inData, inSign, outData, outVerifyInfo);
    if (rv > 0) then
    begin
      //KalkanCOMTest.GetLastError(ret_err);
      KalkanCOMTest.GetLastErrorString(errStr, ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + ' ' + errStr + #13;
      RichEdit1.Text := RichEdit1.Text + outVerifyInfo;
      Exit;
    end;
    if outCert <> '' then
       redt_data.Text := outCert;
    KalkanCOMTest.GetLastErrorString(errStr, ret_err);
    RichEdit1.Text := outVerifyInfo + #13 + #13 + 'Out Data:' + #13 + outData;
  finally
    if outCert <> '' then
       SysFreeString(PWideChar(outCert));
    if inData <> '' then
      SysFreeString(PWideChar(inData));
    if outData <> '' then
      SysFreeString(PWideChar(outData));
    if outVerifyInfo <> '' then
      SysFreeString(PWideChar(outVerifyInfo));

  end;
end;

procedure TForm1.btn_VerifyFileClick(Sender: TObject);
var
tmpStr, tmpInData, inData, outVerifyInfo, outData, inSign, outCert: WideString;
rv: HRESULT;
ret_err: LongWord;
F: TextFile;
begin
  try
    tmpInData := '';
    //AssignFile(F, 'C:\temp\libp11.log');
    //AssignFile(F, 'C:\temp\e_gost_req.log');
    AssignFile(F, 'D:\test\testtext.txt');
    Reset(F);
    while not Eof(F) do
    begin
      Readln(F, tmpStr);
      tmpInData := tmpInData + tmpStr;
    end;
    ret_err := 0;
    inSign := SysAllocString(PWideChar(redt_SignedData.Text));
    inData := SysAllocString(PWideChar(tmpInData));

    outData := '';
    outverifyInfo := '';
    outCert := '';

    //---Verify CMS Sign---
    // KC_SIGN_CMS or KC_IN_PEM
    rv := KalkanCOMTest.VerifyData('', KC_SIGN_CMS or KalkanFlags, 0, inData, inSign, outData, outVerifyInfo, outCert);
    //---Verify Draft Sign---
    // KC_SIGN_DRAFT or KC_IN2_BASE64
    //rv := KalkanCOMTest.VerifyData('', KC_SIGN_CMS or KalkanFlags, inData, inSign, outData, outVerifyInfo);
    if (rv > 0) then
    begin
      KalkanCOMTest.GetLastError(ret_err);
      RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13;
      RichEdit1.Text := RichEdit1.Text + outVerifyInfo;
      Exit;
    end;
    RichEdit1.Text := outVerifyInfo;
  finally
    if outCert <> '' then
       SysFreeString(PWideChar(outCert));
    if inData <> '' then
      SysFreeString(PWideChar(inData));
    if outVerifyInfo <> '' then
      SysFreeString(PWideChar(outVerifyInfo));
    CloseFile(F);
    tmpInData := '';
  end;
end;

procedure TForm1.Button1Click(Sender: TObject);
var
inData, outSign: WideString;
signNodeId, parentSignNode, parentNameSpace: WideString;
rv: HRESULT;
ret_err: LongWord;
  I: Integer;
begin
  if (edtKeyPath.Text = '') then
  begin
    Application.MessageBox('Не указан путь к ключу!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
//  try
    // signNodeId - идентификатор тэга, который необходимо подписать.
    // Не указывается, если необходимо подписать все содержимое документа;
    signNodeId := #0; //'871fd3f8-ca08-46dd-9ec4-b3896c223918';
    // parentSignNode - идентификатор тэга, в который необходимо поместить значение подписи;
    parentSignNode := #0; //'Header';
    // parentNameSpace -  пространство имен тэга, в который необходимо поместить значение подписи.
    // Если пространство имен есть,  но не будет указано - то тег не найдется
    parentNameSpace := #0; //'http://schemas.xmlsoap.org/soap/envelope/';

    inData := SysAllocString(PWideChar(redt_data.Text));

    for I := 1 to 10000 do
    begin
      //rv := KalkanCOMTest.LoadKeyStore(KCST_PKCS12, '123456', 'D:\test\COM_test\keys\GOST.p12', '');
      rv := KalkanCOMTest.SignXML('', 0, signNodeId, parentSignNode, parentNameSpace, inData, outSign);
      if (rv > 0) then
      begin
        KalkanCOMTest.GetLastError(ret_err);
        RichEdit1.Text := IntToStr(i) + 'Error: 0x' + IntToHex(ret_err, 8);
        Exit;
      end;
      if (I <> 10000) then
        SysFreeString(PWideChar(outSign));
    end;

    // KalkanCOMTest.XMLFinalize(); - Не надо вызывать каждый раз при подписи.
    // Можно только один раз после цикла подписания xml файлов.
    KalkanCOMTest.XMLFinalize();

    redt_SignedData.Text := outSign;
//  finally
    if outSign <> '' then
      SysFreeString(PWideChar(outSign));
    if inData <> '' then
      SysFreeString(PWideChar(inData));
//  end;
end;

procedure TForm1.Button2Click(Sender: TObject);
begin
OpenDialog2.Title := 'Select a CRL File';
OpenDialog2.Filter := 'CRL File|*.crl';
if (OpenDialog2.Execute(Form1.Handle)) then
  begin
      edt2.Text := OpenDialog2.FileName ;
  end;
end;

procedure TForm1.Button3Click(Sender: TObject);
begin
  redt_SignedData.Text := '';
  redt_data.Text := '';
  RichEdit1.Text := '';
end;



procedure TForm1.Button4Click(Sender: TObject);
var
inProxyAddr, inProxyPort, inUName, inUPass: WideString;
begin
  inProxyAddr := '';
  inProxyPort := '';
  inUName := '';
  inUPass := '';
  inProxyAddr := SysAllocString(PWideChar(Edit_addr.Text));
  inProxyPort := SysAllocString(PWideChar(Edit_port.Text));
  inUName := SysAllocString(PWideChar(Edit_login.Text));
  inUPass := SysAllocString(PWideChar(Edit_psw.Text));
  KalkanCOMTest.SetProxy(0, inProxyAddr, inProxyPort, inUName, inUPass);


end;

procedure TForm1.btn_HashDataClick(Sender: TObject);
var
outData, err_str: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
  if (redt_data.Text = '') then
    begin
      Application.MessageBox('Нет данных для хеширования!', 'Ошибка', MB_ICONERROR + MB_OK);
      Exit;
    end;
    try
      rv := KalkanCOMTest.HashData(ComboBox1.Items[ComboBox1.ItemIndex], KalkanFlags, redt_data.Text, outData);
      if (rv > 0) then
      begin
        KalkanCOMTest.GetLastErrorString(err_str, ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
        //Exit;
      end;
      redt_SignedData.Text := outData;
    finally
      if (outData <> '') then
        SysFreeString(PWideChar(outData));
    end;

end;

procedure TForm1.btn_HashFileClick(Sender: TObject);
var
outData, err_str: WideString;
rv: HRESULT;
ret_err: LongWord;
begin
  ChooseFile.Title := 'Select a File for hashing';
  KalkanFlags := KalkanFlags or KC_IN_FILE;
  if (ChooseFile.Execute(Form1.Handle)) then
  begin
      if (ChooseFile.FileName = '') then
        begin
          Application.MessageBox('Нет данных для хеширования!', 'Ошибка', MB_ICONERROR + MB_OK);
          Exit;
      end;
      try
        rv := KalkanCOMTest.HashData(ComboBox1.Items[ComboBox1.ItemIndex], KalkanFlags, ChooseFile.FileName, outData);
        if (rv > 0) then
          begin
            KalkanCOMTest.GetLastErrorString(err_str, ret_err);
            RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
            //Exit;
          end;
          redt_SignedData.Text := outData;
      finally
        if (outData <> '') then
          SysFreeString(PWideChar(outData));
      end;
  end;
end;

procedure TForm1.btn_SignHashClick(Sender: TObject);
var
outData, inHash, ascii, err_str, StrTmp, hs, alias: WideString;
rv: HRESULT;
ret_err: LongWord;
Index, i: Integer;
begin
  alias := '';
 if (redt_SignedData.Text = '') then
  begin
    Application.MessageBox('Нет хэш данных для подписи!', 'Ошибка', MB_ICONERROR + MB_OK);
    Exit;
  end;
  try
      inHash := SysAllocString(PWideChar(redt_SignedData.Text));
      rv := KalkanCOMTest.SignHash(alias, kalkanFlags, inHash, outData);
      if (rv > 0) then
      begin
        KalkanCOMTest.GetLastErrorString(err_str, ret_err);
        RichEdit1.Text := 'Error: 0x' + IntToHex(ret_err, 8) + #13 + err_str;
        Exit;
      end;
      RichEdit1.Text := outData;
      //redt_SignedData.Text := outData;
  finally
    if (outData <> '') then
      SysFreeString(PWideChar(outData));
  end;
end;

procedure TForm1.CheckBox1Click(Sender: TObject);
begin
Edit_login.Enabled := CheckBox1.Checked;
Edit_psw.Enabled := CheckBox1.Checked;
end;

procedure TForm1.Edit_portKeyPress(Sender: TObject; var Key: Char);
begin
if ((Key < '0') or (Key > '9')) and (Key <> #08) then
begin
  Key := #0;
end;
end;

procedure TForm1.FormClose(Sender: TObject; var Action: TCloseAction);
begin
 KalkanCOMTest.Finalize();
end;

procedure TForm1.FormCreate(Sender: TObject);
var
rv: HRESULT;
begin
  edt_pincode.Text := 'Qwerty12';
  cbb_StoreType.ItemIndex := 0;

  edt1.Text := 'http://ocsp.pki.gov.kz:80';

  KalkanCOMTest := CoKalkanCryptCOM.Create;
  rv := KalkanCOMTest.Init();

  Edit_login.Enabled := CheckBox1.Checked;
  Edit_psw.Enabled := CheckBox1.Checked;

  //RichEdit1.Perform(EM_LIMITTEXT, 10000000, 0);

end;

procedure TForm1.KC_Flags_Click(Sender: TObject);
begin
  KalkanFlags := 0;
  if (rb_inbase64.Checked) then KalkanFlags := KalkanFlags or KC_IN_BASE64;
  if (rb_inpem.Checked) then KalkanFlags := KalkanFlags or KC_IN_PEM;
  if (rb_inder.Checked) then KalkanFlags := KalkanFlags or KC_IN_DER;
  if (cb_in2base64.Checked) then KalkanFlags := KalkanFlags or KC_IN2_BASE64;

  if (rb_outbase64.Checked) then KalkanFlags := KalkanFlags or KC_OUT_BASE64;
  if (rb_outpem.Checked) then KalkanFlags := KalkanFlags or KC_OUT_PEM;
  if (rb_outder.Checked) then KalkanFlags := KalkanFlags or KC_OUT_DER;

  if (cb_DraftData.Checked) then KalkanFlags := KalkanFlags or KC_SIGN_DRAFT
  else KalkanFlags := KalkanFlags or KC_SIGN_CMS;
  if (cb_Detached.Checked) then KalkanFlags := KalkanFlags or KC_DETACHED_DATA;
  if (cb_WithTimestamp.Checked) then KalkanFlags := KalkanFlags or KC_WITH_TIMESTAMP;

  if (rb_sha256.Checked) then KalkanFlags := KalkanFlags or KC_HASH_SHA256;
  if (rb_gost34311_95.Checked) then KalkanFlags := KalkanFlags or KC_HASH_GOST95;

   if (cb_verifyCert.Checked) then kalkanFlags := kalkanFlags or KC_NOCHECKCERTTIME;
   if (cb_getResp.Checked) then kalkanFlags := kalkanFlags or KC_GET_OCSP_RESPONSE;
   if (cb_inFile.Checked) then kalkanFlags := kalkanFlags or KC_IN_FILE;
end;

end.
