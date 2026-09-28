from django.urls import path

from . import views

urlpatterns = [
    # Для фронтенда сайта
    path('config/', views.egov_qr_config, name='egov_qr_config'),
    path('start/<int:permit_id>/', views.start_egov_qr_session, name='egov_qr_start'),
    path('status/<uuid:session_id>/', views.check_egov_qr_session, name='egov_qr_status'),

    # Публичные — вызывает eGov Mobile (API №1 и API №2)
    path('init/<uuid:session_id>/', views.EgovQrInitView.as_view(), name='egov_qr_init'),
    path('doc/<uuid:session_id>/', views.EgovQrDocView.as_view(), name='egov_qr_doc'),
]
