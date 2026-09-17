from django.urls import include, path
from .views import (RegisterView, LoginView, LogoutView, TokenRefreshView, VerifyTokenView)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', VerifyTokenView.as_view(), name='token-verify'),
    path('services/', include('services.urls')),
    path('appointments/', include('appointments.urls')),
]