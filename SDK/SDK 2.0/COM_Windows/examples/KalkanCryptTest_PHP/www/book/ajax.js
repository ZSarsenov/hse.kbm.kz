//_____________________________________Показать сертификат_________________________________

        $(document).ready(function(){
          $('body').on('click', '#showCertif', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Показать сертификат" ;
            if(window.document.form1.pinCODE.value != "")
            {
              if(window.document.form1.type_store.value!= "Не выбрано")
              {
                if(window.document.form1.keyStore.value !="" )
                {
                  $('textarea[name=textBOX1]').val('');
                  form.ajaxSubmit({
                    beforeSubmit: function(){

                      var ar_Field = form.find('input').fieldSerialize().split('&');

                      for (var i = 0; i < ar_Field.length; i++)
                      {
                        var val = ar_Field[i].split('=');
                      }
                    },
                    complete: function(xhr) {
                      console.log(xhr);
                      $('textarea[name=textBOX1]').val(xhr.responseText);
                    }
                  });
                }
                else{alert("Выберите путь к ключу"); Clear_func();}
              }
              else{alert("Выберите тип хранилища"); Clear_func();}
            }
            else{alert("Ведите PIN-код");Clear_func();} 
          });
        });
//_____________________________________Информация о сертификате____________________________

        $(document).ready(function(){
          $('body').on('click', '#infoCertif', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Информация о сертификате" ;
            
            if(window.document.form1.pinCODE.value != "")
            {
              if(window.document.form1.type_store.value!= "Не выбрано")
              {
                if(window.document.form1.keyStore.value !="" )
                {
                  $('textarea[name=textBOX2]').val('');
                  form.ajaxSubmit({
                    beforeSubmit: function(){

                      var ar_Field = form.find('input').fieldSerialize().split('&');

                      for (var i = 0; i < ar_Field.length; i++)
                      {
                        var val = ar_Field[i].split('=');
                      }
                    },
                    complete: function(xhr) {
                      console.log(xhr);
                      $('textarea[name=textBOX2]').val(xhr.responseText);
                    }
                  });
                }
                else{alert("Выберите путь к ключу"); Clear_func();}
              }
              else{alert("Выберите тип хранилища");Clear_func();}
            }
            else{alert("Ведите PIN-код");Clear_func();}       
          });
        }); 
//_____________________________________Хэшировать данные___________________________________

        $(document).ready(function(){
          $('body').on('click', '#hashData', function(){ 
            var form = $(this).parents('form#form1'); 
            var inPUTdate = document.getElementsByName('inputData');
            var outPUTdate = document.getElementsByName('outputData');
            window.document.form1.infoIden.value = "Хэшировать данные" ;
            if(window.document.form1.textBOX1.value != "")
            {
              if ((inPUTdate[0].checked || inPUTdate[1].checked || inPUTdate[2].checked) && (outPUTdate[0].checked || outPUTdate[1].checked || outPUTdate[2].checked) )
              {
                  $('textarea[name=textBOX2]').val('');

                  form.ajaxSubmit({
                    beforeSubmit: function(){

                      var ar_Field = form.find('input').fieldSerialize().split('&');

                      for (var i = 0; i < ar_Field.length; i++)
                      {
                        var val = ar_Field[i].split('=');
                      }
                    },
                    complete: function(xhr) {
                      console.log(xhr);
                      $('textarea[name=textBOX2]').val(xhr.responseText);
                    }
                  });
              }
              else{alert("Ошибка! \nВыберите тип входных и выходных данных!");} 
            }
            else{alert("Ошибка! \nНет данных для хеширования!");}          
          });
        });
//_____________________________________Подписать хэш-данные________________________________

        $(document).ready(function(){
          $('body').on('click', '#signHashData', function(){ 
            var form = $(this).parents('form#form1'); 
            var inPUTdate = document.getElementsByName('inputData');
            var outPUTdate = document.getElementsByName('outputData');
            window.document.form1.infoIden.value = "Подписать хэш-данные" ;
            if(window.document.form1.textBOX2.value != "")
            {
              if ((inPUTdate[0].checked || inPUTdate[1].checked || inPUTdate[2].checked) && (outPUTdate[0].checked || outPUTdate[1].checked || outPUTdate[2].checked) )
              {
                $('textarea[name=textBOX3]').val('');

                form.ajaxSubmit({
                  beforeSubmit: function(){

                    var ar_Field = form.find('input').fieldSerialize().split('&');

                    for (var i = 0; i < ar_Field.length; i++)
                    {
                      var val = ar_Field[i].split('=');
                    }
                  },
                  complete: function(xhr) {
                    console.log(xhr);
                    $('textarea[name=textBOX3]').val(xhr.responseText);
                  }
                });
              }
              else{alert("Ошибка! \nВыберите тип входных и выходных данных!");} 
            }
            else{alert("Ошибка! \nНет хэш данных для подписи!");}          
          });
        });
//_____________________________________Подписать данные____________________________________

        $(document).ready(function(){
          $('body').on('click', '#signData', function(){ 
            var form = $(this).parents('form#form1'); 
            var inPUTdate = document.getElementsByName('inputData');
            var outPUTdate = document.getElementsByName('outputData');
            window.document.form1.infoIden.value = "Подписать данные" ;
            if(window.document.form1.pinCODE.value != "")
            {
              if(window.document.form1.type_store.value!= "Не выбрано")
              {
                if(window.document.form1.keyStore.value !="" )
                {
                 if ((inPUTdate[0].checked || inPUTdate[1].checked || inPUTdate[2].checked) && (outPUTdate[0].checked || outPUTdate[1].checked || outPUTdate[2].checked) )
                 {
                    $('textarea[name=textBOX2]').val('');

                    form.ajaxSubmit({
                      beforeSubmit: function(){

                        var ar_Field = form.find('input').fieldSerialize().split('&');

                        for (var i = 0; i < ar_Field.length; i++)
                        {
                          var val = ar_Field[i].split('=');
                        }
                      },
                      complete: function(xhr) {
                        console.log(xhr);
                        $('textarea[name=textBOX2]').val(xhr.responseText);
                      }
                    });
                  }
                  else{alert("Ошибка! \nВыберите тип входных и выходных данных!");} 
                }
                else{alert("Выберите путь к ключу");}
              }
              else{alert("Выберите тип хранилища");}
            }
            else{alert("Ведите PIN-код");}       
          });
        });
//_____________________________________Проверить данные____________________________________
         
        $(document).ready(function(){
          $('body').on('click', '#verifyData', function(){ 
            var form = $(this).parents('form#form1'); 
            
            window.document.form1.infoIden.value = "Проверить данные" ;

            if(window.document.form1.pinCODE.value != "")
            {
              if(window.document.form1.type_store.value!= 0)
              {
                if(window.document.form1.keyStore.value !="" )
                {
                $('textarea[name=textBOX3]').val('');

                  form.ajaxSubmit({
                    beforeSubmit: function(){

                      var ar_Field = form.find('input').fieldSerialize().split('&');

                      for (var i = 0; i < ar_Field.length; i++)
                      {
                        var val = ar_Field[i].split('=');
                      }
                    },
                    complete: function(xhr) {
                      console.log(xhr);
                      $('textarea[name=textBOX3]').val(xhr.responseText);
                    window.document.form1.textBOX1.value = "" ;
                    }
                  });
                }
                else{alert("Выберите путь к ключу");}
              }
              else{alert("Выберите тип хранилища");}
            }
            else{alert("Ведите PIN-код");}            
          });
        });
//_____________________________________Получить время подписи______________________________

        $(document).ready(function(){
          $('body').on('click', '#getTimeSig', function(){ 
            var form = $(this).parents('form#form1'); 
            
            window.document.form1.infoIden.value = "Получить время подписи" ;
            if(window.document.form1.textBOX2.value != "")
            {
              $('textarea[name=textBOX3]').val('');

              form.ajaxSubmit({
                beforeSubmit: function(){

                  var ar_Field = form.find('input').fieldSerialize().split('&');

                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX3]').val(xhr.responseText);
                }
              });
            }
            else{alert("Ошибка! \nДанные еще не подписаны!");}          
          });
        });
//_____________________________________Подписать XML_______________________________________

        $(document).ready(function(){
          $('body').on('click', '#signXML', function(){ 
            var form = $(this).parents('form#form1'); 
            window.document.form1.infoIden.value = "Подписать XML" ;
            if(window.document.form1.keyStore.value !="" )
            {
              if(window.document.form1.textBOX1.value != "")
              {
                $('textarea[name=textBOX2]').val('');
                form.ajaxSubmit({
                  beforeSubmit: function(){

                    var ar_Field = form.find('input').fieldSerialize().split('&');

                    for (var i = 0; i < ar_Field.length; i++)
                    {
                      var val = ar_Field[i].split('=');
                    }
                  },
                  complete: function(xhr) {
                    console.log(xhr);
                    $('textarea[name=textBOX2]').val(xhr.responseText);
                  }
                });
              }
              else{alert("Не указан путь к ключу!\nОшибка!");}   
            }
            else{alert("Не XML-данных!\nОшибка!");}       
          });
        });
//_____________________________________Проверить XML_______________________________________

        $(document).ready(function(){
          $('body').on('click', '#verifyXML', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Проверить XML" ;
            if(window.document.form1.textBOX2.value !="" )
            {
              $('textarea[name=textBOX3]').val('');
              form.ajaxSubmit({
                beforeSubmit: function(){

                  var ar_Field = form.find('input').fieldSerialize().split('&');

                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX3]').val(xhr.responseText);
                }
              });
            }
            else{alert("Нет подписанной XML!\n Ошибка");}     
          });
        });
//_____________________________________Получить сертификат из XML__________________________

        $(document).ready(function(){
          $('body').on('click', '#getCerFromXML', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Получить сертификат из XML" ;
            if(window.document.form1.textBOX2.value !="" )
            {
              $('textarea[name=textBOX1]').val('');
              form.ajaxSubmit({
                beforeSubmit: function(){

                  var ar_Field = form.find('input').fieldSerialize().split('&');

                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX1]').val(xhr.responseText);
                }
              });
            }
            else{alert("Нет XML!\n Ошибка");}     
          });
        });
//_____________________________________Получить сертификат из CMS__________________________
        $(document).ready(function(){
          $('body').on('click', '#getCerFromCMS', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Получить сертификат из CMS" ;
            if(window.document.form1.textBOX2.value !="" )
            {
              $('textarea[name=textBOX1]').val('');
              form.ajaxSubmit({
                beforeSubmit: function(){
                  var ar_Field = form.find('input').fieldSerialize().split('&');
                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX1]').val(xhr.responseText);
                }
              });
            }
            else{alert("Нет CMS! \n Ошибка!");}
          });
        });
//_____________________________________Проверка сертификата________________________________

        $(document).ready(function(){
          $('body').on('click', '#checkCert', function(){ 
            var form = $(this).parents('form#form1'); 
            var CRL = document.getElementsByName('CLS');
            
            window.document.form1.infoIden.value = "Проверка сертификата" ;
            if (CRL[0].checked || CRL[1].checked )
            {
              if(window.document.form1.pinCODE.value != "")
              {
                if(window.document.form1.type_store.value!= 0)
                {
                    if(window.document.form1.keyStore.value !="" )
                    {
                    $('textarea[name=textBOX3]').val('');

                    form.ajaxSubmit({
                      beforeSubmit: function(){

                        var ar_Field = form.find('input').fieldSerialize().split('&');

                        for (var i = 0; i < ar_Field.length; i++)
                        {
                          var val = ar_Field[i].split('=');
                        }
                      },
                      complete: function(xhr) {
                        console.log(xhr);
                        $('textarea[name=textBOX3]').val(xhr.responseText);
                      }
                    });
                  }
                  else{alert("Выберите путь к ключу");}
                }
                else{alert("Выберите тип хранилища");}
              }
              else{alert("Ведите PIN-код");}         
            }
            else{alert("Выберите источник проверки");}
          });
        });
//_____________________________________Подписать файл______________________________________
        $(document).ready(function(){
          $('body').on('click', '#signFile', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Подписать файл" ;
            if(window.document.form1.file11.value !="" )
            {
              $('textarea[name=textBOX2]').val('');
              form.ajaxSubmit({
                beforeSubmit: function(){

                  var ar_Field = form.find('input').fieldSerialize().split('&');

                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX2]').val(xhr.responseText);
                }
              });
            }
            else{alert("Выберите файл!");} 
          });
        });
//_____________________________________Проверить файл______________________________________

        $(document).ready(function(){
          $('body').on('click', '#verifyFile', function(){ 
            var form = $(this).parents('form#form1'); 
            window.document.form1.infoIden.value = "Проверить файл" ;
            if(window.document.form1.file11.value != "")
            {
              $('textarea[name=textBOX3]').val('');
              form.ajaxSubmit({
                beforeSubmit: function(){

                  var ar_Field = form.find('input').fieldSerialize().split('&');

                  for (var i = 0; i < ar_Field.length; i++)
                  {
                    var val = ar_Field[i].split('=');
                  }
                },
                complete: function(xhr) {
                  console.log(xhr);
                  $('textarea[name=textBOX3]').val(xhr.responseText);
                }
              });
            }
            else{alert("Выберите, пожалуйста, файл!");}
          });
        });
//_____________________________________Tokens______________________________________________

        $(document).ready(function(){
          $('body').on('click', '#btokens', function(){ 
            var form = $(this).parents('form#form1');
            window.document.form1.infoIden.value = "Выбор Token" ;
                  form.ajaxSubmit({
                    beforeSubmit: function(){

                      var ar_Field = form.find('input').fieldSerialize().split('&');

                      for (var i = 0; i < ar_Field.length; i++)
                      {
                        var val = ar_Field[i].split('=');
                      }
                    },
                    complete: function(xhr) {
                      console.log(xhr);

                      $('input[name=alias_text]').val(xhr.responseText);
                      document.getElementById("alias").options.length=0;
                      var elementSelect = document.getElementById("alias");

                      window.document.form1.alias_num.value = "1";
                      var names = window.document.form1.alias_text.value;
                      var arr = names.split(';');

                      for (var i = 0; i < arr.length; i++) {
                        var option = document.createElement ("option");
                        option.text = arr[i];
                        option.value = arr[i];
                        elementSelect.options.add(option);
                      }
                      elementSelect.selectedIndex = 0;

                    }
                  });
          });
        });

       
