from django.urls import path
# pyrefly: ignore [missing-import]
from .views.viewsSociete import SocieteDeleteView, SocieteDetailView, SocieteListCreateView, SocieteUpdateView
# pyrefly: ignore [missing-import]
from .views.viewsTypeContrat import TypeContratCreateView, TypeContratDeleteView, TypeContratDetailView, TypeContratListView, TypeContratUpdateView

# pyrefly: ignore [missing-import]
from .views.viewsTypeWorker import (
    TypeWorkerDeleteView, 
    TypeWorkerDetailView,
    TypeWorkerCreateView,
    TypeWorkerListView,
    TypeWorkerUpdateView
)
# pyrefly: ignore [missing-import]
from .views.viewsWorkers import (
    WorkerDeleteAPIView,
    WorkerDetailAPIView,
    WorkerUpdateAPIView,
    WorkerCreateAPIView,
    WorkerListAPIView
)
# pyrefly: ignore [missing-import]
from .views.viewsSite import (
    SiteDeleteAPIView,
    SiteDetailAPIView,
    SiteUpdateAPIView,
    SiteCreateAPIView,
    SiteListAPIView
)

# pyrefly: ignore [missing-import]
from .views.viewsMachine import (
    MachineDeleteAPIView,
    MachineDetailAPIView,
    MachineUpdateAPIView,
    MachineCreateAPIView,
    MachineListAPIView
)
# pyrefly: ignore [missing-import]
from .views.viewsWorkerAssignment import (
    WorkerAssignmentListAPIView,
    WorkerAssignmentCreateAPIView,
    WorkerAssignmentDetailAPIView,
    WorkerAssignmentUpdateAPIView,
    WorkerAssignmentDeleteAPIView
)
urlpatterns = [
    # TYPE WORKER
    path("type-workers/", TypeWorkerListView.as_view(),name='type_worker_list_create'),
    path("type-workers/<int:pk>/", TypeWorkerDetailView.as_view(),name='type_worker_detail'),
    path("type-workers/update/<int:pk>/", TypeWorkerUpdateView.as_view(),name='type_worker_update'),
    # path("type-workers/delete/<int:pk>/", TypeWorkerDeleteView.as_view(),name='type_worker_delete'),
    path("type-workers/create/", TypeWorkerCreateView.as_view(),name='type_worker_create'),
    # TYPE CONTRAT
    path("type-contrats/", TypeContratListView.as_view(),name='type_contrat_list_create'),
    path("type-contrats/create/", TypeContratCreateView.as_view(),name='type_contrat_create'),
    path("type-contrats/<uuid:pk>/", TypeContratDetailView.as_view(),name='type_contrat_detail'),
    path("type-contrats/update/<uuid:pk>/", TypeContratUpdateView.as_view(),name='type_contrat_update'),
    path("type-contrats/delete/<uuid:pk>/", TypeContratDeleteView.as_view(),name='type_contrat_delete'),
    # SOCIETE
    path("societes/", SocieteListCreateView.as_view(),name='societe_list_create'),
    path("societes/<uuid:pk>/", SocieteDetailView.as_view(),name='societe_detail'),
    path("societes/update/<uuid:pk>/", SocieteUpdateView.as_view(),name='societe_update'),
    path("societes/delete/<uuid:pk>/", SocieteDeleteView.as_view(),name='societe_delete'),

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