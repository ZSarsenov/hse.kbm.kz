from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import WorkPermit, WorkPermitTemplate, ApprovalStep

User = get_user_model()


# 1. Сериализатор для Пользователя (чтобы видеть ФИО, ИИН, БИН)
class UserInfoSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default='')

    class Meta:
        model = User
        # Включаем наши новые поля
        fields = ('id', 'first_name', 'last_name', 'iin', 'bin', 'tabel_number', 'position', 'department_name')


# 2. Сериализатор для Шагов согласования
class ApprovalStepSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    role_label = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = ApprovalStep
        fields = ('id', 'sequence', 'approver_name', 'role', 'role_label', 'status', 'signed_at', 'comment')


# 3. Сериализатор для Шаблонов (Он у тебя был)
class WorkPermitTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkPermitTemplate
        fields = ('id', 'name', 'description')
        read_only_fields = ('id',)


# 4. ГЛАВНЫЙ СЕРИАЛИЗАТОР: Наряд-допуск
class PermitSerializer(serializers.ModelSerializer):
    # Вкладываем полную информацию об инициаторе
    initiator = UserInfoSerializer(read_only=True)

    # Вкладываем шаги согласования (предполагаем, что related_name='approval_records')
    approval_steps = ApprovalStepSerializer(many=True, read_only=True, source='approval_records')

    class Meta:
        model = WorkPermit
        # Возвращаем все поля + вложенные данные
        fields = (
            'id',
            'permit_id',
            'template_type',  # Убедись, что это поле есть в модели, иначе убери
            'status',
            'created_at',
            'valid_from',
            'valid_to',
            'initiator',
            'approval_steps',
            'data'  # JSON поле с формой
        )
        read_only_fields = ('id', 'permit_id', 'created_at', 'initiator', 'status')

    def create(self, validated_data):
        # Автоматически назначаем текущего пользователя инициатором
        user = self.context['request'].user
        validated_data['initiator'] = user
        return super().create(validated_data)