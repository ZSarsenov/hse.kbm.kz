from rest_framework import serializers
from .models import User


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    class Meta:
        model = User
        fields = ('id', 'full_name', 'position', 'department_name')

    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}".strip() or obj.username