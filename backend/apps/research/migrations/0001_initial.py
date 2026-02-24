# Generated migration for research app

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResearchProject',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=500)),
                ('description', models.TextField(blank=True)),
                ('research_type', models.CharField(choices=[('market', 'Market Research'), ('competitive', 'Competitive Intelligence'), ('technical', 'Technical Research'), ('regulatory', 'Regulatory Research')], max_length=50)),
                ('status', models.CharField(choices=[('active', 'Active'), ('completed', 'Completed'), ('archived', 'Archived')], default='active', max_length=20)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('completion_date', models.DateField(blank=True, null=True)),
                ('key_findings', models.JSONField(default=list)),
                ('recommendations', models.JSONField(default=list)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ResearchSource',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('source_name', models.CharField(max_length=255)),
                ('source_type', models.CharField(choices=[('publication', 'Publication'), ('website', 'Website'), ('report', 'Report'), ('interview', 'Interview'), ('database', 'Database')], max_length=50)),
                ('url', models.URLField(blank=True)),
                ('publication_date', models.DateField(blank=True, null=True)),
                ('content_summary', models.TextField(blank=True)),
                ('relevance_score', models.FloatField(default=0.0)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sources', to='research.researchproject')),
            ],
            options={
                'ordering': ['-publication_date'],
            },
        ),
        migrations.CreateModel(
            name='MarketIntelligence',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('topic', models.CharField(max_length=255)),
                ('market_segment', models.CharField(max_length=255, blank=True)),
                ('description', models.TextField()),
                ('relevance_to_company', models.TextField(blank=True)),
                ('last_updated', models.DateField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='market_intel', to='research.researchproject')),
            ],
            options={
                'ordering': ['-last_updated'],
            },
        ),
        migrations.CreateModel(
            name='CompetitorProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('company_name', models.CharField(max_length=300)),
                ('duns_number', models.CharField(blank=True, max_length=50)),
                ('market_focus', models.JSONField(default=list)),
                ('estimated_revenue', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('key_personnel', models.JSONField(default=list)),
                ('recent_wins', models.JSONField(default=list)),
                ('known_weaknesses', models.TextField(blank=True)),
                ('known_strengths', models.TextField(blank=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='competitors', to='research.researchproject')),
            ],
            options={
                'ordering': ['company_name'],
            },
        ),
    ]
