# Generated migration for strategy app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import pgvector.django
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CompanyStrategy',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('version', models.IntegerField(default=1)),
                ('effective_date', models.DateField()),
                ('is_active', models.BooleanField(default=True)),
                ('mission_statement', models.TextField(blank=True)),
                ('vision_3_year', models.TextField(blank=True)),
                ('target_revenue', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('target_win_rate', models.FloatField(default=0.4)),
                ('target_margin', models.FloatField(default=0.12)),
                ('target_agencies', models.JSONField(default=list)),
                ('target_domains', models.JSONField(default=list)),
                ('target_naics_codes', models.JSONField(default=list)),
                ('growth_markets', models.JSONField(default=list)),
                ('mature_markets', models.JSONField(default=list)),
                ('exit_markets', models.JSONField(default=list)),
                ('differentiators', models.JSONField(default=list)),
                ('win_themes', models.JSONField(default=list)),
                ('pricing_philosophy', models.TextField(blank=True)),
                ('teaming_strategy', models.TextField(blank=True)),
                ('technology_roadmap', models.TextField(blank=True)),
                ('talent_acquisition_plan', models.TextField(blank=True)),
                ('strategic_risks', models.JSONField(default=list)),
                ('mitigation_actions', models.JSONField(default=list)),
                ('success_metrics', models.JSONField(default=list)),
            ],
            options={
                'ordering': ['-effective_date'],
            },
        ),
        migrations.CreateModel(
            name='StrategicGoal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('goal_name', models.CharField(max_length=300)),
                ('goal_description', models.TextField()),
                ('goal_type', models.CharField(choices=[('revenue', 'Revenue'), ('margin', 'Margin'), ('market_share', 'Market Share'), ('capability', 'Capability'), ('operational', 'Operational'), ('talent', 'Talent')], max_length=50)),
                ('target_value', models.CharField(blank=True, max_length=100)),
                ('target_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('planned', 'Planned'), ('in_progress', 'In Progress'), ('achieved', 'Achieved'), ('at_risk', 'At Risk'), ('off_track', 'Off Track')], default='planned', max_length=20)),
                ('owner', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='strategic_goals', to=settings.AUTH_USER_MODEL)),
                ('strategy', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='goals', to='strategy.companystrategy')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='StrategicScore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('opportunity', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='opportunities.opportunity', related_name='strategic_scores')),
                ('strategy', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='strategy.companystrategy')),
            ],
        ),
        migrations.CreateModel(
            name='PortfolioSnapshot',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('snapshot_date', models.DateField(auto_now_add=True)),
                ('total_pipeline_value', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('active_opportunities', models.IntegerField(default=0)),
                ('average_deal_value', models.DecimalField(decimal_places=2, default=0, max_digits=15)),
                ('projected_revenue', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('win_rate_3_month', models.FloatField(default=0.0)),
                ('pipeline_by_market', models.JSONField(default=dict)),
                ('pipeline_by_domain', models.JSONField(default=dict)),
                ('strategy', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='portfolio_snapshots', to='strategy.companystrategy')),
            ],
            options={
                'ordering': ['-snapshot_date'],
            },
        ),
    ]
