from django.contrib import admin
from .models import Flat, Room, Bed, Tenant

@admin.register(Flat)
class FlatAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'address')
    search_fields = ('name', 'address')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'flat', 'max_capacity')
    search_fields = ('name', 'flat__name')
    list_filter = ('flat',)

@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'room', 'status')
    search_fields = ('name', 'room__name')
    list_filter = ('status', 'room')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone', 'bed')
    search_fields = ('name', 'phone')
