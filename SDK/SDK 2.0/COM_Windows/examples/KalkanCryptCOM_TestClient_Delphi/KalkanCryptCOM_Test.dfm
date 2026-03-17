object Form1: TForm1
  Left = 0
  Top = 0
  Caption = 'KNCA '#169' Kalkan Crypt Test Project'
  ClientHeight = 790
  ClientWidth = 1269
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'Tahoma'
  Font.Style = []
  OldCreateOrder = False
  OnClose = FormClose
  OnCreate = FormCreate
  PixelsPerInch = 96
  TextHeight = 13
  object pgc1: TPageControl
    Left = 8
    Top = 8
    Width = 1104
    Height = 774
    ActivePage = ts1
    MultiLine = True
    TabOrder = 0
    object ts1: TTabSheet
      Caption = '1. '#1055#1086#1076#1087#1080#1089#1072#1085#1080#1077'/'#1087#1088#1086#1074#1077#1088#1082#1072' XML '#1080' '#1076#1072#1085#1085#1099#1093'. '
      object lbl1: TLabel
        Left = 3
        Top = 68
        Width = 70
        Height = 13
        Caption = #1055#1091#1090#1100' '#1082' '#1082#1083#1102#1095#1091
      end
      object lbl2: TLabel
        Left = 3
        Top = 35
        Width = 43
        Height = 13
        Caption = #1055#1048#1053' '#1082#1086#1076
      end
      object lbl4: TLabel
        Left = 3
        Top = 3
        Width = 80
        Height = 26
        Caption = #1058#1080#1087' '#1082#1083#1102#1095#1077#1074#1086#1075#1086' '#1093#1088#1072#1085#1080#1083#1080#1097#1072
        WordWrap = True
      end
      object Label1: TLabel
        Left = 824
        Top = 415
        Width = 185
        Height = 13
        Caption = #1060#1086#1088#1084#1072#1090' '#1074#1093#1086#1076#1085#1099#1093'/'#1074#1099#1093#1086#1076#1085#1099#1093' '#1076#1072#1085#1085#1099#1093
      end
      object Label2: TLabel
        Left = 1018
        Top = 354
        Width = 34
        Height = 13
        Caption = 'Sign ID'
      end
      object btnVerifyXML: TButton
        Left = 821
        Top = 263
        Width = 255
        Height = 25
        Caption = 'Verify XML'
        TabOrder = 0
        OnClick = btnVerifyXMLClick
      end
      object btnSignXML: TButton
        Left = 821
        Top = 238
        Width = 125
        Height = 25
        Caption = 'Sign XML'
        TabOrder = 1
        OnClick = btnSignXMLClick
      end
      object edtKeyPath: TEdit
        Left = 89
        Top = 65
        Width = 217
        Height = 21
        TabOrder = 2
      end
      object btnSelectKey: TButton
        Left = 312
        Top = 63
        Width = 26
        Height = 24
        Caption = '...'
        TabOrder = 3
        OnClick = btnSelectKeyClick
      end
      object redt_SignedData: TRichEdit
        Left = 0
        Top = 340
        Width = 793
        Height = 241
        Font.Charset = RUSSIAN_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'Tahoma'
        Font.Style = []
        ParentFont = False
        ScrollBars = ssVertical
        TabOrder = 4
        Zoom = 100
      end
      object redt_data: TRichEdit
        Left = 3
        Top = 93
        Width = 790
        Height = 241
        Font.Charset = RUSSIAN_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'Tahoma'
        Font.Style = []
        ParentFont = False
        ScrollBars = ssVertical
        TabOrder = 5
        Zoom = 100
      end
      object edt_pincode: TEdit
        Left = 89
        Top = 32
        Width = 249
        Height = 21
        PasswordChar = '*'
        TabOrder = 6
      end
      object btn_GetCert: TButton
        Left = 821
        Top = 3
        Width = 255
        Height = 25
        Caption = #1055#1086#1082#1072#1079#1072#1090#1100' '#1089#1077#1088#1090#1080#1092#1080#1082#1072#1090' '#1082#1083#1102#1095#1072
        TabOrder = 7
        OnClick = btn_GetCertClick
      end
      object btn_SignData: TButton
        Left = 821
        Top = 121
        Width = 125
        Height = 25
        Caption = 'Sign Data'
        TabOrder = 8
        OnClick = btn_SignDataClick
      end
      object btn_CertInfo: TButton
        Left = 821
        Top = 28
        Width = 255
        Height = 25
        Caption = #1048#1085#1092#1086#1088#1084#1072#1094#1080#1103' '#1086' '#1089#1077#1088#1090#1080#1092#1080#1082#1072#1090#1077
        TabOrder = 9
        OnClick = btn_CertInfoClick
      end
      object btn_VerifyData: TButton
        Left = 952
        Top = 121
        Width = 124
        Height = 25
        Caption = 'Verify Data'
        TabOrder = 10
        OnClick = btn_VerifyDataClick
      end
      object cbb_StoreType: TComboBox
        Left = 89
        Top = 5
        Width = 249
        Height = 21
        Style = csDropDownList
        TabOrder = 11
        Items.Strings = (
          #1060#1072#1081#1083#1086#1074#1072#1103' '#1089#1080#1089#1090#1077#1084#1072' - PKCS#12 (*.p12)'
          #1059#1076#1086#1089#1090#1086#1074#1077#1088#1077#1085#1080#1077' '#1083#1080#1095#1085#1086#1089#1090#1080' '#1075#1088#1072#1078#1076#1072#1085#1080#1085#1072' '#1056#1050' (KZIDCard)'
          'Kaztoken'
          'eToken72K'
          'JaCarta'
          #1057#1077#1088#1090#1080#1092#1080#1082#1072#1090' PEM (*.cer, *.crt, *.pem)'
          'aKey')
      end
      object grp1: TGroupBox
        Left = 824
        Top = 534
        Width = 255
        Height = 96
        TabOrder = 12
        object cb_WithTimestamp: TCheckBox
          Left = 3
          Top = 38
          Width = 238
          Height = 17
          Caption = #1044#1086#1073#1072#1074#1080#1090#1100' '#1084#1077#1090#1082#1091' '#1074#1088#1077#1084#1077#1085#1080' '#1074' '#1087#1086#1076#1087#1080#1089#1100
          TabOrder = 0
          OnClick = KC_Flags_Click
        end
        object cb_DraftData: TCheckBox
          Left = 3
          Top = 3
          Width = 238
          Height = 17
          Caption = #1057#1099#1088#1072#1103' '#1087#1086#1076#1087#1080#1089#1100' (V - Darft Sign, 0 - CMS)'
          TabOrder = 1
          OnClick = KC_Flags_Click
        end
        object cb_Detached: TCheckBox
          Left = 3
          Top = 20
          Width = 238
          Height = 17
          Caption = #1055#1086#1076#1087#1080#1089#1100' '#1093#1088#1072#1085#1080#1090#1089#1103' '#1086#1090#1076#1077#1083#1100#1085#1086' '#1086#1090' '#1076#1072#1085#1085#1099#1093
          TabOrder = 2
          WordWrap = True
          OnClick = KC_Flags_Click
        end
        object cb_verifyCert: TCheckBox
          Left = 3
          Top = 55
          Width = 249
          Height = 17
          Caption = #1053#1077' '#1087#1088#1086#1074#1077#1088#1103#1090#1100' '#1089#1088#1086#1082' '#1076#1077#1081#1089#1090#1074#1080#1103' '#1089#1077#1088#1090#1080#1092#1080#1082#1072#1090#1072
          TabOrder = 3
          OnClick = KC_Flags_Click
        end
        object cb_getResp: TCheckBox
          Left = 3
          Top = 72
          Width = 222
          Height = 17
          Caption = #1042#1099#1074#1077#1089#1090#1080' OCSP - responce'
          TabOrder = 4
          OnClick = KC_Flags_Click
        end
      end
      object btn_CheckDoc: TButton
        Left = 821
        Top = 196
        Width = 255
        Height = 25
        Caption = #1055#1088#1086#1074#1077#1088#1082#1072' '#1089#1077#1088#1090#1080#1092#1080#1082#1072#1090#1072
        TabOrder = 13
        OnClick = btn_CheckDocClick
      end
      object Panel1: TPanel
        Left = 371
        Top = 0
        Width = 422
        Height = 59
        TabOrder = 14
        object edt2: TEdit
          Left = 109
          Top = 32
          Width = 273
          Height = 21
          TabOrder = 0
        end
        object RadioButton2: TRadioButton
          Left = 15
          Top = 34
          Width = 74
          Height = 17
          Caption = 'CRL'
          TabOrder = 1
        end
        object Button2: TButton
          Left = 388
          Top = 32
          Width = 26
          Height = 22
          Caption = '...'
          TabOrder = 2
          OnClick = Button2Click
        end
        object RadioButton1: TRadioButton
          Left = 15
          Top = 7
          Width = 74
          Height = 17
          Caption = 'OCSP'
          TabOrder = 3
        end
        object edt1: TEdit
          Left = 109
          Top = 5
          Width = 273
          Height = 21
          TabOrder = 4
        end
      end
      object RichEdit1: TRichEdit
        Left = 3
        Top = 587
        Width = 790
        Height = 157
        Font.Charset = RUSSIAN_CHARSET
        Font.Color = clWindowText
        Font.Height = -11
        Font.Name = 'Tahoma'
        Font.Style = []
        ParentFont = False
        ScrollBars = ssVertical
        TabOrder = 15
        Zoom = 100
      end
      object GroupBox1: TGroupBox
        Left = 824
        Top = 434
        Width = 125
        Height = 94
        TabOrder = 16
        object rb_inbase64: TRadioButton
          Left = 3
          Top = 3
          Width = 113
          Height = 17
          Caption = 'IN Base64'
          TabOrder = 0
          OnClick = KC_Flags_Click
        end
        object rb_inpem: TRadioButton
          Left = 3
          Top = 18
          Width = 113
          Height = 17
          Caption = 'IN PEM'
          TabOrder = 1
          OnClick = KC_Flags_Click
        end
        object rb_inder: TRadioButton
          Left = 3
          Top = 33
          Width = 113
          Height = 17
          Caption = 'IN DER'
          TabOrder = 2
          OnClick = KC_Flags_Click
        end
        object cb_in2base64: TCheckBox
          Left = 3
          Top = 48
          Width = 97
          Height = 17
          Caption = 'IN2 Base64'
          TabOrder = 3
          OnClick = KC_Flags_Click
        end
        object cb_inFile: TCheckBox
          Left = 3
          Top = 63
          Width = 97
          Height = 17
          Caption = 'IN FILE'
          TabOrder = 4
          OnClick = KC_Flags_Click
        end
      end
      object GroupBox2: TGroupBox
        Left = 952
        Top = 434
        Width = 124
        Height = 94
        TabOrder = 17
        object rb_outder: TRadioButton
          Left = 3
          Top = 33
          Width = 113
          Height = 17
          Caption = 'OUT DER'
          TabOrder = 0
          OnClick = KC_Flags_Click
        end
        object rb_outpem: TRadioButton
          Left = 3
          Top = 18
          Width = 113
          Height = 17
          Caption = 'OUT PEM'
          TabOrder = 1
          OnClick = KC_Flags_Click
        end
        object rb_outbase64: TRadioButton
          Left = 3
          Top = 3
          Width = 113
          Height = 17
          Caption = 'OUT Base64'
          TabOrder = 2
          OnClick = KC_Flags_Click
        end
      end
      object btn_SignFile: TButton
        Left = 821
        Top = 171
        Width = 125
        Height = 25
        Caption = 'Sign File'
        TabOrder = 18
        OnClick = btn_SignFileClick
      end
      object btn_VerifyFile: TButton
        Left = 952
        Top = 171
        Width = 124
        Height = 25
        Caption = 'Verify File'
        TabOrder = 19
        OnClick = btn_VerifyFileClick
      end
      object btn_getcertfromxml: TButton
        Left = 821
        Top = 323
        Width = 191
        Height = 25
        Caption = 'Get Certificate from XML'
        TabOrder = 20
        OnClick = btn_getcertfromxmlClick
      end
      object Edit2: TEdit
        Left = 1058
        Top = 350
        Width = 18
        Height = 21
        MaxLength = 1
        NumbersOnly = True
        TabOrder = 21
        Text = '1'
      end
      object Button1: TButton
        Left = 821
        Top = 687
        Width = 255
        Height = 25
        Caption = 'Test Sign XML'
        TabOrder = 22
        OnClick = Button1Click
      end
      object Button3: TButton
        Left = 821
        Top = 718
        Width = 255
        Height = 25
        Caption = 'Clear'
        TabOrder = 23
        OnClick = Button3Click
      end
      object btn_GetTimeFromCMS: TButton
        Left = 821
        Top = 146
        Width = 255
        Height = 25
        Caption = #1055#1086#1083#1091#1095#1080#1090#1100' '#1074#1088#1077#1084#1103' '#1087#1086#1076#1087#1080#1089#1080
        TabOrder = 24
        OnClick = btn_GetTimeFromCMSClick
      end
      object btn_GetCertFromCMS: TButton
        Left = 821
        Top = 348
        Width = 191
        Height = 25
        Caption = 'Get Certificate from CMS'
        TabOrder = 25
        OnClick = btn_GetCertFromCMSClick
      end
      object Button5: TButton
        Left = 821
        Top = 60
        Width = 75
        Height = 25
        Caption = 'HashData'
        TabOrder = 26
        OnClick = btn_HashDataClick
      end
      object rb_sha256: TRadioButton
        Left = 983
        Top = 69
        Width = 57
        Height = 25
        Caption = 'sha256'
        TabOrder = 27
        OnClick = KC_Flags_Click
      end
      object rb_gost34311_95: TRadioButton
        Left = 983
        Top = 55
        Width = 113
        Height = 17
        Caption = 'gost34311_95'
        TabOrder = 28
        OnClick = KC_Flags_Click
      end
      object btn_SignHash: TButton
        Left = 821
        Top = 96
        Width = 255
        Height = 25
        Caption = 'Sign Hash'
        TabOrder = 29
        OnClick = btn_SignHashClick
      end
      object btn_HashFile: TButton
        Left = 902
        Top = 60
        Width = 75
        Height = 25
        Caption = 'Hash File'
        TabOrder = 30
        OnClick = btn_HashFileClick
      end
      object btnSignWSSE: TButton
        Left = 952
        Top = 238
        Width = 124
        Height = 25
        Caption = 'Sign WSSE'
        TabOrder = 31
        OnClick = btnSignWSSEClick
      end
      object btn_GetCertFromZIP: TButton
        Left = 821
        Top = 373
        Width = 191
        Height = 25
        Caption = 'Get Certificate from ZIP'
        TabOrder = 32
        OnClick = btn_GetCertFromZIPClick
      end
      object btnSignZip: TButton
        Left = 821
        Top = 288
        Width = 125
        Height = 25
        Caption = 'Sign Zip File'
        TabOrder = 33
        OnClick = btnSignZipClick
      end
      object btnVerifyZip: TButton
        Left = 952
        Top = 288
        Width = 124
        Height = 25
        Caption = 'Verify Zip file'
        TabOrder = 34
        OnClick = btnVerifyZipClick
      end
      object ComboBox1: TComboBox
        Left = 386
        Top = 66
        Width = 407
        Height = 21
        TabOrder = 35
      end
    end
    object TabSheet1: TTabSheet
      Caption = '2. '#1053#1072#1089#1090#1088#1086#1081#1082#1080
      ImageIndex = 1
      object Panel2: TPanel
        Left = 40
        Top = 32
        Width = 361
        Height = 233
        BorderStyle = bsSingle
        TabOrder = 0
        object Label3: TLabel
          Left = 16
          Top = 8
          Width = 86
          Height = 13
          Caption = #1053#1072#1089#1090#1088#1086#1082#1080' '#1087#1088#1086#1082#1089#1080
        end
        object Label4: TLabel
          Left = 16
          Top = 40
          Width = 31
          Height = 13
          Caption = #1040#1076#1088#1077#1089
        end
        object Label5: TLabel
          Left = 16
          Top = 67
          Width = 25
          Height = 13
          Caption = #1055#1086#1088#1090
        end
        object Label6: TLabel
          Left = 16
          Top = 136
          Width = 30
          Height = 13
          Caption = #1051#1086#1075#1080#1085
        end
        object Label7: TLabel
          Left = 16
          Top = 163
          Width = 37
          Height = 13
          Caption = #1055#1072#1088#1086#1083#1100
        end
        object Edit_addr: TEdit
          Left = 64
          Top = 37
          Width = 281
          Height = 21
          TabOrder = 0
        end
        object Edit_port: TEdit
          Left = 64
          Top = 64
          Width = 281
          Height = 21
          TabOrder = 1
          OnKeyPress = Edit_portKeyPress
        end
        object Edit_login: TEdit
          Left = 64
          Top = 133
          Width = 281
          Height = 21
          TabOrder = 3
        end
        object Edit_psw: TEdit
          Left = 64
          Top = 160
          Width = 281
          Height = 21
          PasswordChar = '*'
          TabOrder = 4
        end
        object Button4: TButton
          Left = 264
          Top = 192
          Width = 75
          Height = 25
          Caption = #1057#1086#1093#1088#1072#1085#1080#1090#1100
          TabOrder = 5
          OnClick = Button4Click
        end
        object CheckBox1: TCheckBox
          Left = 16
          Top = 105
          Width = 329
          Height = 17
          Caption = #1055#1088#1086#1082#1089#1080'-'#1089#1077#1088#1074#1077#1088' '#1090#1088#1077#1073#1091#1077#1090' '#1072#1074#1090#1086#1088#1080#1079#1072#1094#1080#1080
          TabOrder = 2
          OnClick = CheckBox1Click
        end
      end
    end
  end
  object OpenDialog1: TOpenDialog
    Left = 1044
    Top = 712
  end
  object OpenDialog2: TOpenDialog
    Left = 1044
    Top = 664
  end
  object ChooseFile: TOpenDialog
    Left = 1120
    Top = 664
  end
  object ChooseFileForSign: TOpenDialog
    Left = 1120
    Top = 712
  end
end
