from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentMethodViewSet,
    PaymentViewSet,
    SubscriptionPaymentViewSet,
    CreatePaymentPreferenceView,
    SavePaymentMethodView,
    CreateSubscriptionView,
    CancelSubscriptionView,
    PaymentSummaryView,
    SubscriptionStatusView,
    webhook_handler
)

# Router para ViewSets
router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'subscriptions', SubscriptionPaymentViewSet, basename='subscriptions')

urlpatterns = [
    # Incluir rutas del router
    path('', include(router.urls)),
    
    # Rutas específicas para acciones
    path('create-preference/', CreatePaymentPreferenceView.as_view(), name='create-preference'),
    path('save-payment-method/', SavePaymentMethodView.as_view(), name='save-payment-method'),
    path('create-subscription/', CreateSubscriptionView.as_view(), name='create-subscription'),
    path('cancel-subscription/', CancelSubscriptionView.as_view(), name='cancel-subscription'),
    
    # Rutas para información y estadísticas
    path('summary/', PaymentSummaryView.as_view(), name='payment-summary'),
    path('subscription-status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    
    # Webhook de MercadoPago
    path('webhook/', webhook_handler, name='mercadopago-webhook'),
]