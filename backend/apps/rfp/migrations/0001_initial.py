# Generated migration for rfp app

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('deals', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RFPDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=500)),
                ('rfp_number', models.CharField(blank=True, max_length=100, unique=True)),
                ('document_file', models.FileField(upload_to='rfp_documents/')),
                ('issue_date', models.DateField(blank=True, null=True)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('document_url', models.URLField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('deal', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='rfp_document', to='deals.deal')),
            ],
            options={
                'ordering': ['-issue_date'],
            },
        ),
        migrations.CreateModel(
            name='RFPRequirement',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('requirement_number', models.CharField(max_length=50)),
                ('requirement_text', models.TextField()),
                ('requirement_type', models.CharField(choices=[('mandatory', 'Mandatory'), ('desired', 'Desired'), ('optional', 'Optional')], default='mandatory', max_length=20)),
                ('section', models.CharField(blank=True, max_length=255)),
                ('evaluation_criteria', models.TextField(blank=True)),
                ('our_compliance_status', models.CharField(choices=[('compliant', 'Compliant'), ('non_compliant', 'Non-Compliant'), ('unclear', 'Unclear')], blank=True, default='unclear', max_length=20)),
                ('rfp_document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='requirements', to='rfp.rfpdocument')),
            ],
            options={
                'ordering': ['requirement_number'],
            },
        ),
        migrations.CreateModel(
            name='ComplianceMatrixItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('requirement_reference', models.CharField(max_length=100)),
                ('our_approach', models.TextField()),
                ('proposal_section', models.CharField(blank=True, max_length=255)),
                ('compliance_level', models.CharField(choices=[('full', 'Full Compliance'), ('partial', 'Partial Compliance'), ('non_compliant', 'Non-Compliant')], default='full', max_length=20)),
                ('risk_level', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='low', max_length=10)),
                ('notes', models.TextField(blank=True)),
                ('rfp_document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='compliance_matrix', to='rfp.rfpdocument')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Amendment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('amendment_number', models.CharField(max_length=50)),
                ('amendment_date', models.DateField()),
                ('summary', models.TextField()),
                ('document_file', models.FileField(upload_to='rfp_amendments/', blank=True)),
                ('rfp_document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='amendments', to='rfp.rfpdocument')),
            ],
            options={
                'ordering': ['-amendment_date'],
            },
        ),
    ]
