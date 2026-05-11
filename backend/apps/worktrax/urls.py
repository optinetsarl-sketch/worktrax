from django.urls import path

from .views.viewsWorkers import (
    WorkerDeleteAPIView,
    WorkerDetailAPIView,
    WorkerUpdateAPIView,
    WorkerCreateAPIView,
    WorkerListAPIView
)

from .views.viewsSite import (
    SiteDeleteAPIView,
    SiteDetailAPIView,
    SiteUpdateAPIView,
    SiteCreateAPIView,
    SiteListAPIView
)

from .views.viewsMachine import (
    MachineDeleteAPIView,
    MachineDetailAPIView,
    MachineUpdateAPIView,
    MachineCreateAPIView,
    MachineListAPIView
)

from .views.viewsWorkerAssignment import (
    WorkerAssignmentListAPIView,
    WorkerAssignmentCreateAPIView,
    WorkerAssignmentDetailAPIView,
    WorkerAssignmentUpdateAPIView,
    WorkerAssignmentDeleteAPIView
)
urlpatterns = [
    ### URLS DES OUVRIERS ###
    path('workers/',WorkerListAPIView.as_view(),name='worker-list'),
    path('workers-create/',WorkerCreateAPIView.as_view(),name='worker-create'),
    path('workers/<int:pk>/',WorkerDetailAPIView.as_view(),name='worker-detail'),
    path('workers/<int:pk>/update/',WorkerUpdateAPIView.as_view(),name='worker-update'),
    path('workers/<int:pk>/delete/',WorkerDeleteAPIView.as_view(),name='worker-delete'),

    ### URLS DES CHANTIERS ###
    path('sites/',SiteListAPIView.as_view(),name='site-list'),
    path('sites-create/',SiteCreateAPIView.as_view(),name='site-create'),
    path('sites/<int:pk>/',SiteDetailAPIView.as_view(),name='site-detail'),
    path('sites/<int:pk>/update/',SiteUpdateAPIView.as_view(),name='site-update'),
    path('sites/<int:pk>/delete/',SiteDeleteAPIView.as_view(),name='site-delete'),

    ### URLS DES ENGINS ###
    path('machines/',MachineListAPIView.as_view(),name='machine-list'),
    path('machines-create/',MachineCreateAPIView.as_view(),name='machine-create'),
    path('machines/<int:pk>/',MachineDetailAPIView.as_view(),name='machine-detail'),
    path('machines/<int:pk>/update/',MachineUpdateAPIView.as_view(),name='machine-update'),
    path('machines/<int:pk>/delete/',MachineDeleteAPIView.as_view(),name='machine-delete'),

    ### URLS DES AFFECTATIONS DES OUVRIERS AUX CHANTIERS ###
    path('worker-assignments/',WorkerAssignmentListAPIView.as_view(),name='worker-assignment-list'),
    path('worker-assignments-create/',WorkerAssignmentCreateAPIView.as_view(),name='worker-assignment-create'),
    path('worker-assignments/<int:pk>/',WorkerAssignmentDetailAPIView.as_view(),name='worker-assignment-detail'),
    path('worker-assignments/<int:pk>/update/',WorkerAssignmentUpdateAPIView.as_view(),name='worker-assignment-update'),
    path('worker-assignments/<int:pk>/delete/',WorkerAssignmentDeleteAPIView.as_view(),name='worker-assignment-delete'),
]