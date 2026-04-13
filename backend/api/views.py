"""
api/views.py — BedR API views
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction
from .models import Flat, Room, Bed, Tenant
from .serializers import FlatSerializer, RoomSerializer, BedSerializer, TenantSerializer


class FlatViewSet(viewsets.ModelViewSet):
    queryset = Flat.objects.all()
    serializer_class = FlatSerializer

    def destroy(self, request, *args, **kwargs):
        flat = self.get_object()
        # Rule 5: Deleting a Flat: check if any of its beds have an assigned tenant.
        if Tenant.objects.filter(bed__room__flat=flat).exists():
            return Response(
                {"detail": "Cannot delete flat. One or more beds in this flat currently have assigned tenants."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        flat_pk = self.kwargs.get('flat_pk')
        if flat_pk:
            qs = qs.filter(flat_id=flat_pk)
        return qs

    def create(self, request, *args, **kwargs):
        # Auto-inject flat_pk into payload if missing, accommodating nested routing POST /flats/<id>/rooms/
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        flat_pk = self.kwargs.get('flat_pk')
        if flat_pk and 'flat' not in data:
            data['flat'] = flat_pk
            
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        room_pk = self.kwargs.get('room_pk')
        if room_pk:
            qs = qs.filter(room_id=room_pk)
            
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
            
        return qs

    def create(self, request, *args, **kwargs):
        # Auto-inject room_pk into payload if missing for nested POST /rooms/<id>/beds/
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        room_pk = self.kwargs.get('room_pk')
        if room_pk and 'room' not in data:
            data['room'] = room_pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        room = serializer.validated_data['room']
        
        # Rule 1: Creating a bed: check if room's current bed count has reached max_capacity.
        if room.beds.count() >= room.max_capacity:
            return Response(
                {"detail": f"Room '{room.name}' has reached its maximum capacity of {room.max_capacity} beds."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def destroy(self, request, *args, **kwargs):
        tenant = self.get_object()
        # Rule 6: Deleting a Tenant: check if they have an active bed assignment.
        if tenant.bed is not None:
            return Response(
                {"detail": "Cannot delete tenant because they still have an active bed assignment. Please unassign the bed first."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer):
        self._handle_bed_assignment(serializer)
        
    @transaction.atomic
    def perform_update(self, serializer):
        self._handle_bed_assignment(serializer)

    def _handle_bed_assignment(self, serializer):
        """
        Handles Rules 2, 3, and 4 regarding bed availability logic when a tenant is created/updated.
        """
        # If body doesn't contain 'bed' (e.g. PATCH to only change phone number), just save.
        if 'bed' not in serializer.validated_data:
            serializer.save()
            return
            
        new_bed = serializer.validated_data['bed']
        instance = serializer.instance
        old_bed = instance.bed if instance else None
        
        # If bed hasn't changed, just save.
        if new_bed == old_bed:
            serializer.save()
            return
            
        # Rule 4: Removing a tenant's bed assignment
        if new_bed is None:
            if old_bed:
                old_bed.status = 'available'
                old_bed.save()
            serializer.save()
            return
            
        # Rule 2a, 2b: Assigning a new bed — validation
        if new_bed.status == 'occupied':
            raise ValidationError({"detail": "Cannot assign tenant to this bed because it is currently occupied."})
        if new_bed.status == 'maintenance':
            raise ValidationError({"detail": "Cannot assign tenant to this bed because it is currently under maintenance."})
            
        # Rule 2c: If tenant already has a bed, mark old bed as 'available'
        if old_bed:
            old_bed.status = 'available'
            old_bed.save()
            
        # Rule 3: When assigning a bed successfully, set the new bed status to 'occupied'
        new_bed.status = 'occupied'
        new_bed.save()
        
        serializer.save()


class DashboardView(APIView):
    def get(self, request):
        flats = Flat.objects.all()
        dashboard_data = []

        for flat in flats:
            flat_summary = {
                "flat_id": flat.id,
                "flat_name": flat.name,
                "total_beds": 0,
                "occupied_beds": 0,
                "rooms": []
            }

            for room in flat.rooms.all():
                room_total_beds = room.beds.count()
                room_occupied_beds = room.beds.filter(status='occupied').count()
                
                if room_total_beds > 0:
                    room_percentage = (room_occupied_beds / room_total_beds) * 100
                else:
                    room_percentage = 0
                
                flat_summary['rooms'].append({
                    "room_id": room.id,
                    "room_name": room.name,
                    "total_beds": room_total_beds,
                    "occupied_beds": room_occupied_beds,
                    "occupancy_percentage": round(room_percentage, 2)
                })

                flat_summary['total_beds'] += room_total_beds
                flat_summary['occupied_beds'] += room_occupied_beds

            if flat_summary['total_beds'] > 0:
                flat_percentage = (flat_summary['occupied_beds'] / flat_summary['total_beds']) * 100
            else:
                flat_percentage = 0
            
            flat_summary['occupancy_percentage'] = round(flat_percentage, 2)
            dashboard_data.append(flat_summary)

        return Response(dashboard_data)
