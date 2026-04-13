"""
api/urls.py — BedR API route definitions
"""

from django.urls import path
from .views import FlatViewSet, RoomViewSet, BedViewSet, TenantViewSet, DashboardView

app_name = 'api'

# Custom bindings explicitly mapping the required endpoints
flat_list = FlatViewSet.as_view({'get': 'list', 'post': 'create'})
flat_detail = FlatViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'})

room_list = RoomViewSet.as_view({'get': 'list', 'post': 'create'})
room_detail = RoomViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'})

bed_list = BedViewSet.as_view({'get': 'list', 'post': 'create'})
bed_detail = BedViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'})

tenant_list = TenantViewSet.as_view({'get': 'list', 'post': 'create'})
tenant_detail = TenantViewSet.as_view({'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Flats
    path('flats/', flat_list, name='flat-list'),
    path('flats/<int:pk>/', flat_detail, name='flat-detail'),
    
    # Rooms (nested under flat for creation and listing)
    path('flats/<int:flat_pk>/rooms/', room_list, name='flat-rooms'),
    path('rooms/<int:pk>/', room_detail, name='room-detail'),
    
    # Beds (nested under room for creation and listing, + global list for status checks)
    path('beds/', bed_list, name='all-beds'),
    path('rooms/<int:room_pk>/beds/', bed_list, name='room-beds'),
    path('beds/<int:pk>/', bed_detail, name='bed-detail'),
    
    # Tenants
    path('tenants/', tenant_list, name='tenant-list'),
    path('tenants/<int:pk>/', tenant_detail, name='tenant-detail'),
]
