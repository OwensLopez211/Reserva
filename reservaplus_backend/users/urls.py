# users/urls.py - CON JWT

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Autenticación JWT
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh-token'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # Gestión del perfil del usuario actual
    path('me/profile/', views.UserProfileView.as_view(), name='current-user-profile'),
    path('me/update/', views.CurrentUserUpdateView.as_view(), name='current-user-update'),
    
    # Gestión de usuarios de la organización (con limitaciones de plan)
    path('organization/', views.OrganizationUserListView.as_view(), name='organization-users-list'),
    path('organization/create/', views.OrganizationUserCreateView.as_view(), name='organization-user-create'),
    path('organization/<uuid:id>/', views.OrganizationUserDetailView.as_view(), name='organization-user-detail'),
    path('organization/<uuid:user_id>/toggle-status/', views.UserToggleStatusView.as_view(), name='user-toggle-status'),
    
    # Gestión de perfiles de usuarios de la organización (solo para owners/admins)
    path('organization/<uuid:user_id>/profile/', views.UserProfileDetailView.as_view(), name='organization-user-profile'),
    
    # Información de roles
    path('roles/', views.UserRolesView.as_view(), name='user-roles'),
    
    # CRUD de usuarios (ViewSet existente)
    path('', include(router.urls)),
]