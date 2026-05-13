from django.urls import path

from .views.viewsLogin import LoginView
from .views.viewsUser import UserListCreateView
from .views.viewsRole import RoleListCreateView


urlpatterns = [
    path('login/', LoginView.as_view()),
    path("roles/", RoleListCreateView.as_view()),
    # path("", UserViewSet.as_view()),
    # path("", UserViewSet.as_view({'get': 'list', 'post': 'create'})),
    path("", UserListCreateView.as_view()),
]