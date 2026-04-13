from rest_framework import serializers
from .models import Flat, Room, Bed, Tenant

# ─────────────────────────────────────────────
# Simple Serializers (to prevent deep circular nesting)
# ─────────────────────────────────────────────

class TenantSimpleSerializer(serializers.ModelSerializer):
    """Basic representation of a Tenant for nesting."""
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone']


class BedSimpleSerializer(serializers.ModelSerializer):
    """Basic representation of a Bed for nesting."""
    class Meta:
        model = Bed
        fields = ['id', 'name', 'status', 'room']


# ─────────────────────────────────────────────
# Primary Serializers
# ─────────────────────────────────────────────

class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = ['id', 'name', 'status', 'room']

    def to_representation(self, instance):
        """
        Includes tenant info if occupied, 
        but accepts standard 'room' ID for writes.
        """
        representation = super().to_representation(instance)
        try:
            # OneToOne reverse relation throws DoesNotExist if missing
            tenant = instance.tenant
            representation['tenant'] = TenantSimpleSerializer(tenant).data
        except Tenant.DoesNotExist:
            representation['tenant'] = None
            
        return representation


class RoomSerializer(serializers.ModelSerializer):
    # Read-only nested list of beds
    beds = BedSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'max_capacity', 'flat', 'beds']


class FlatSerializer(serializers.ModelSerializer):
    # Read-only nested list of rooms
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Flat
        fields = ['id', 'name', 'address', 'rooms']


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone', 'bed']

    def to_representation(self, instance):
        """
        Shows assigned bed details on read,
        but accepts standard 'bed' ID for writes.
        """
        representation = super().to_representation(instance)
        if hasattr(instance, 'bed') and instance.bed is not None:
            representation['bed'] = BedSimpleSerializer(instance.bed).data
            
        return representation
