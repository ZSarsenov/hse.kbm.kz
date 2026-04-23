
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (WorkPermit, WorkPermitTemplate, ApprovalStep, Location, Department, DangerousWorkType,
                     Notification)

User = get_user_model()


# 1. Сериализатор для Пользователя
class UserInfoSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    name = serializers.CharField(source='get_full_name', read_only=True)
    role_label = serializers.CharField(source='get_role_display', read_only=True)  # Человеческое название (Выдающий...)

    class Meta:
        model = User
        fields = ('id', 'username', "name", 'first_name', 'last_name', "surname", 'role', 'role_label', 'iin', 'bin',
                  'tabel_number', 'position', 'department_name')


# 2. Сериализатор для Шагов согласования
class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    role_label = serializers.CharField(source='get_role_display', read_only=True)
    approver_id = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalStep
        fields = ('id', 'step_order', 'approver_id', 'approver_name', 'role', 'role_label', 'status', 'signed_at',
                  'signed_xml', 'signer_details', 'rejection_reason')

    def get_approver_id(self, obj):
        return obj.approver_id

    def get_approver_name(self, obj):
        if obj.approver_id:
            return obj.approver.get_full_name()
        if obj.role == 'WORK_PRODUCER':
            permit = obj.permit
            pdata = (permit.data or {}).get('producer') or {}
            if isinstance(pdata, dict) and pdata.get('external'):
                return (pdata.get('name') or pdata.get('freeText') or '').strip() or 'Производитель работ (без ЭЦП)'
        return '—'



# 3. Сериализатор для Шаблонов
class WorkPermitTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkPermitTemplate
        fields = ('id', 'name', 'description')
        read_only_fields = ('id',)


# 4. ГЛАВНЫЙ СЕРИАЛИЗАТОР: Наряд-допуск
class PermitSerializer(serializers.ModelSerializer):
    initiator = UserInfoSerializer(read_only=True)
    # Исправлено: убрали source='approval_steps'
    approval_steps = ApprovalStepSerializer(many=True, read_only=True)

    templateType = serializers.CharField(source='template.name', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = WorkPermit
        fields = (
            'id',
            'permit_id',
            'template',
            'templateType',
            'status',
            'created_at',
            'valid_from',
            'valid_to',
            'initiator',
            'location',
            'location_name',
            'approval_steps',
            'data',
            'scan_file',
            'safety_document',
            'producer_closed',
        )
        read_only_fields = ('id', 'permit_id', 'created_at', 'initiator', 'status', 'approval_steps', 'template',
                            'templateType', 'location_name')


    def create(self, validated_data):
        # 1. Достаем пользователя
        user = self.context['request'].user
        validated_data['initiator'] = user

        # Номер наряда не присваивается черновику — генерируется при отправке на согласование

        # 3. АВТОМАТИЧЕСКИ ПОДСТАВЛЯЕМ ШАБЛОН
        template_obj, _ = WorkPermitTemplate.objects.get_or_create(
            name="Наряд повышенной опасности",
            defaults={'description': 'Стандартный наряд'}
        )
        validated_data['template'] = template_obj

        # 4. Обработка локации
        raw_location_name = self.initial_data.get('location_name')
        if raw_location_name:
            from .models import Location
            loc, _ = Location.objects.get_or_create(name=raw_location_name)
            validated_data['location'] = loc

        return super().create(validated_data)


# 5. Сериализатор для Департаментов
class DepartamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'name')


# 6. Сериализатор для Видов работ
class DangerousWorkTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DangerousWorkType
        fields = ('id', 'name', 'color_code')


# 7. Сериализатор для уведомления
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at', 'permit_id']