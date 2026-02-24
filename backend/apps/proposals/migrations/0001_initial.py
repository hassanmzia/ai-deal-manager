# Generated migration for proposals app

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
            name='ProposalTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True)),
                ('structure', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Proposal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=500)),
                ('version', models.IntegerField(default=1)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('in_review', 'In Review'), ('approved', 'Approved'), ('submitted', 'Submitted'), ('awarded', 'Awarded'), ('lost', 'Lost')], default='draft', max_length=20)),
                ('submission_deadline', models.DateTimeField(blank=True, null=True)),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('compliance_review_done', models.BooleanField(default=False)),
                ('red_team_done', models.BooleanField(default=False)),
                ('executive_summary', models.TextField(blank=True)),
                ('key_messages', models.JSONField(default=list)),
                ('draft_document', models.FileField(blank=True, upload_to='proposals/')),
                ('final_document', models.FileField(blank=True, upload_to='proposals/')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_proposals', to=settings.AUTH_USER_MODEL)),
                ('deal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='proposals', to='deals.deal')),
                ('template', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='proposals.proposaltemplate')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ReviewCycle',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cycle_type', models.CharField(choices=[('red_team', 'Red Team'), ('compliance', 'Compliance'), ('executive', 'Executive'), ('customer_final', 'Customer Final')], max_length=20)),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('in_progress', 'In Progress'), ('completed', 'Completed')], default='scheduled', max_length=20)),
                ('scheduled_date', models.DateTimeField(blank=True, null=True)),
                ('completion_date', models.DateTimeField(blank=True, null=True)),
                ('feedback_summary', models.TextField(blank=True)),
                ('proposal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='review_cycles', to='proposals.proposal')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ReviewComment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('page_number', models.IntegerField(blank=True, null=True)),
                ('section', models.CharField(blank=True, max_length=255)),
                ('comment_text', models.TextField()),
                ('severity', models.CharField(choices=[('minor', 'Minor'), ('major', 'Major'), ('critical', 'Critical')], default='minor', max_length=20)),
                ('status', models.CharField(choices=[('open', 'Open'), ('resolved', 'Resolved'), ('deferred', 'Deferred')], default='open', max_length=20)),
                ('resolution_notes', models.TextField(blank=True)),
                ('reviewer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='proposal_comments', to=settings.AUTH_USER_MODEL)),
                ('review_cycle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='proposals.reviewcycle')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProposalSection',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('section_name', models.CharField(max_length=255)),
                ('section_number', models.CharField(blank=True, max_length=50)),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='proposal_sections', to=settings.AUTH_USER_MODEL)),
                ('proposal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sections', to='proposals.proposal')),
            ],
            options={
                'ordering': ['section_number'],
            },
        ),
    ]
