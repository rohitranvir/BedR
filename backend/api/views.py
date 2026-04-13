
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from .models import Flat, Room, Bed, Tenant
from .serializers import FlatSerializer, RoomSerializer, BedSerializer, TenantSerializer


class FlatViewSet(viewsets.ModelViewSet):
    queryset = Flat.objects.all()
    serializer_class = FlatSerializer

    def destroy(self, request, *args, **kwargs):
        flat = self.get_object()
        # can't delete a flat while people are still living in it
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
        # DRF nested routing doesn't set the parent FK on the payload for us
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
        # same as above — manually carry room_pk into the payload
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        room_pk = self.kwargs.get('room_pk')
        if room_pk and 'room' not in data:
            data['room'] = room_pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        room = serializer.validated_data['room']
        
        # hard stop — don't let beds exceed what the room was configured for
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
        # force unassign before delete so beds don't get stuck as 'occupied'
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

        if 'bed' not in serializer.validated_data:
            serializer.save()
            return
            
        new_bed = serializer.validated_data['bed']
        instance = serializer.instance
        old_bed = instance.bed if instance else None
        

        if new_bed == old_bed:
            serializer.save()
            return
            
        # tenant is being unassigned — free up the old bed
        if new_bed is None:
            if old_bed:
                old_bed.status = 'available'
                old_bed.save()
            serializer.save()
            return
            
        # reject the assignment if the bed isn't free
        if new_bed.status == 'occupied':
            raise ValidationError({"detail": "Cannot assign tenant to this bed because it is currently occupied."})
        if new_bed.status == 'maintenance':
            raise ValidationError({"detail": "Cannot assign tenant to this bed because it is currently under maintenance."})
            
        # moving to a new bed — release the previous one
        if old_bed:
            old_bed.status = 'available'
            old_bed.save()
            
        # lock the new bed so nobody else can grab it
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
                "address": flat.address,
                "total_beds": 0,
                "occupied_beds": 0,
                "potential_revenue": 0.0,
                "actual_revenue": 0.0,
                "commission_rate": float(flat.commission_rate),
                "rooms": []
            }

            for room in flat.rooms.all():
                room_beds = room.beds.all()
                room_total_beds = room_beds.count()
                room_occupied_beds = room_beds.filter(status='occupied').count()
                
                room_potential = sum(bed.price for bed in room_beds)
                room_actual = sum(bed.price for bed in room_beds if bed.status == 'occupied')
                
                if room_total_beds > 0:
                    room_percentage = (room_occupied_beds / room_total_beds) * 100
                else:
                    room_percentage = 0
                
                flat_summary['rooms'].append({
                    "room_id": room.id,
                    "room_name": room.name,
                    "total_beds": room_total_beds,
                    "occupied_beds": room_occupied_beds,
                    "occupancy_percentage": round(room_percentage, 2),
                    "potential_revenue": float(room_potential),
                    "actual_revenue": float(room_actual)
                })

                flat_summary['total_beds'] += room_total_beds
                flat_summary['occupied_beds'] += room_occupied_beds
                flat_summary['potential_revenue'] += float(room_potential)
                flat_summary['actual_revenue'] += float(room_actual)

            if flat_summary['total_beds'] > 0:
                flat_percentage = (flat_summary['occupied_beds'] / flat_summary['total_beds']) * 100
            else:
                flat_percentage = 0
            
            flat_summary['occupancy_percentage'] = round(flat_percentage, 2)
            flat_summary['commission_earned'] = round(flat_summary['actual_revenue'] * (flat_summary['commission_rate'] / 100), 2)
            dashboard_data.append(flat_summary)

        return Response(dashboard_data)


class OccupancyTrendView(APIView):
    """
    Returns monthly trend data for the past N months (default 12).
    Each point: { month, new_tenants, cumulative_tenants, occupied_beds }
    Query param: ?months=3|6|12
    """
    def get(self, request):
        months = int(request.query_params.get('months', 12))
        months = max(1, min(months, 24))  # clamp 1–24

        today = timezone.localdate()
        # start of the first month in the window
        start_date = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        for _ in range(months - 1):
            start_date = (start_date - timedelta(days=1)).replace(day=1)

        # Monthly new-tenant counts
        monthly_qs = (
            Tenant.objects
            .filter(joined_at__gte=start_date)
            .annotate(month=TruncMonth('joined_at'))
            .values('month')
            .annotate(new_tenants=Count('id'))
            .order_by('month')
        )
        monthly_map = {
            entry['month'].strftime('%Y-%m'): entry['new_tenants']
            for entry in monthly_qs
        }

        # Tenants who joined BEFORE the window (baseline for cumulative)
        baseline = Tenant.objects.filter(joined_at__lt=start_date).count()

        # Build full month-by-month series
        result = []
        cumulative = baseline
        current = start_date
        for _ in range(months):
            key = current.strftime('%Y-%m')
            label = current.strftime('%b %Y')
            new_t = monthly_map.get(key, 0)
            cumulative += new_t
            result.append({
                'month': label,
                'new_tenants': new_t,
                'cumulative_tenants': cumulative,
                'occupied_beds': Bed.objects.filter(status='occupied').count()  # current snapshot
            })
            # advance to next month
            next_month = (current.replace(day=28) + timedelta(days=4)).replace(day=1)
            current = next_month

        return Response(result)
