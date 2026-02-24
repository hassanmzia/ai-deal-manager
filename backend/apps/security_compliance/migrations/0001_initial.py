# Generated migration for security_compliance app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('deals', '0001_initial'),
        ('accounts', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SecurityFramework',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True)),
                ('framework_type', models.CharField(choices=[('nist', 'NIST'), ('iso27001', 'ISO 27001'), ('cis', 'CIS Controls'), ('cmmc', 'CMMC'), ('custom', 'Custom')], max_length=50)),
                ('version', models.CharField(blank=True, max_length=20)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['framework_type'],
            },
        ),
        migrations.CreateModel(
            name='SecurityControl',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('control_id', models.CharField(max_length=100)),
                ('control_name', models.CharField(max_length=300)),
                ('description', models.TextField()),
                ('implementation_status', models.CharField(choices=[('not_started', 'Not Started'), ('in_progress', 'In Progress'), ('implemented', 'Implemented'), ('optimized', 'Optimized')], default='not_started', max_length=20)),
                ('maturity_level', models.IntegerField(default=0)),
                ('framework', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='controls', to='security_compliance.securityframework')),
            ],
            options={
                'ordering': ['control_id'],
            },
        ),
        migrations.CreateModel(
            name='SecurityControlMapping',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('our_control_name', models.CharField(max_length=300)),
                ('implementation_notes', models.TextField(blank=True)),
                ('supporting_evidence', models.JSONField(default=list)),
                ('last_assessed', models.DateField(blank=True, null=True)),
                ('security_control', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mappings', to='security_compliance.securitycontrol')),
            ],
            options={
                'ordering': ['-last_assessed'],
            },
        ),
        migrations.CreateModel(
            name='SecurityComplianceReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('report_title', models.CharField(max_length=300)),
                ('report_type', models.CharField(choices=[('audit', 'Audit'), ('self_assessment', 'Self-Assessment'), ('assessment', 'Assessment'), ('scan', 'Scan')], max_length=20)),
                ('report_date', models.DateField()),
                ('framework', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reports', to='security_compliance.securityframework')),
                ('assessed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='security_reports', to=settings.AUTH_USER_MODEL)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='security_reports', to='deals.deal')),
            ],
            options={
                'ordering': ['-report_date'],
            },
        ),
        migrations.CreateModel(
            name='ComplianceRequirement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('requirement_title', models.CharField(max_length=300)),
                ('requirement_text', models.TextField()),
                ('source_framework', models.CharField(max_length=100)),
                ('compliance_status', models.CharField(choices=[('compliant', 'Compliant'), ('non_compliant', 'Non-Compliant'), ('in_progress', 'In Progress'), ('deferred', 'Deferred')], default='in_progress', max_length=20)),
                ('risk_level_if_not_met', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='compliance_requirements', to='deals.deal')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
