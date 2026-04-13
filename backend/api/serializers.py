from rest_framework import serializers
from .models import Flat, Room, Bed, Tenant

# flat versions used for embedding — avoids the full serializer blowing up with circular nesting

class TenantSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone', 'photo']


class BedSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
    room_name = serializers.CharField(source='room.name', read_only=True)
    class Meta:
        model = Bed
        fields = ['id', 'name', 'status', 'room', 'room_name', 'price']


class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = ['id', 'name', 'status', 'room', 'price']

    def to_representation(self, instance):
        # writes take a plain room ID, reads return the tenant object sitting on the bed
        representation = super().to_representation(instance)
        try:
            tenant = instance.tenant
            representation['tenant'] = TenantSimpleSerializer(tenant).data
        except Tenant.DoesNotExist:
            representation['tenant'] = None

        return representation


class RoomSerializer(serializers.ModelSerializer):
    beds = BedSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'max_capacity', 'flat', 'beds']


class FlatSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Flat
        fields = ['id', 'name', 'address', 'lat', 'lng', 'rooms', 'commission_rate']


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'phone', 'photo', 'bed']

    def to_representation(self, instance):
        # writes take a plain bed ID, reads expand it into the full bed object
        representation = super().to_representation(instance)
        if hasattr(instance, 'bed') and instance.bed is not None:
            representation['bed'] = BedSimpleSerializer(instance.bed).data

        return representation
