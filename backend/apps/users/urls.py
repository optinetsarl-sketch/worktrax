from django.urls import path

from .views.viewsLogin import LoginView, LogoutView
from .views.viewsUser import UserListCreateView
from .views.viewsRole import RoleListCreateView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("roles/", RoleListCreateView.as_view()),
    path("", UserListCreateView.as_view()),
     # path("", UserViewSet.as_view()),
    # path("", UserViewSet.as_view({'get': 'list', 'post': 'create'})),
]