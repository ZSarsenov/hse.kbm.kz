from rest_framework import serializers
from .models import WorkPermitTemplate


class WorkPermitTemplateSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkPermitTemplate
        fields = ('id', 'name', 'description')
        read_only_fields = ('id',)
