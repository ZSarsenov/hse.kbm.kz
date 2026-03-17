program KalkanCryptCOM_TestProject;

uses
  Vcl.Forms,
  KalkanCryptCOM_Test in 'KalkanCryptCOM_Test.pas' {Form1},
  KalkanCryptCOM_TLB in 'KalkanCryptCOM_TLB.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.CreateForm(TForm1, Form1);
  Application.Run;
end.
