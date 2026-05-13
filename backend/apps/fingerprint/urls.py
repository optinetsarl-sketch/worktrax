from django.urls import path

from .views.views_ouvrierFingerprint import OuvrierRegisterFaceView

# from .views.views_usersFingerprin import LoginFaceView, RegisterFaceView
from .views.views_ouvrierFingerprint import (
     OuvrierRegisterFaceView
 )

urlpatterns = [
    path('register-face/', OuvrierRegisterFaceView.as_view()),
    # path('register-face/', RegisterFaceView.as_view()),
    # path('login-face/', LoginFaceView.as_view()),
]