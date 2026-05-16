from django.urls import path

# pyrefly: ignore [missing-import]
from .views.viewsLogin import LoginView, LogoutView
# pyrefly: ignore [missing-import]
from .views.viewsUser import UserCreateView, UserListView
# pyrefly: ignore [missing-import]
from .views.viewsRole import RoleListCreateView

urlpatterns = [
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("roles/", RoleListCreateView.as_view()),
    path("create-user/", UserCreateView.as_view()),
    path("usersliste/", UserListView.as_view()),
    ### POUR ACTIVER OU DESACTIVER UN USER ###
    # path('users/<int:pk>/toggle-active/', ToggleUserActiveView.as_view()),
     # path("", UserViewSet.as_view()),
    # path("", UserViewSet.as_view({'get': 'list', 'post': 'create'})),
]