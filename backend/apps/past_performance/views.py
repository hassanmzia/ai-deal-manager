from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import PastPerformance, PastPerformanceMatch
from .serializers import (
    PastPerformanceDetailSerializer,
    PastPerformanceListSerializer,
    PastPerformanceMatchSerializer,
)


class PastPerformanceViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for past performance records.

    Supports filtering by client_agency, naics_codes, contract_type,
    performance_rating, and is_active. Searchable by project_name,
    client_agency, description, and contract_number.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "client_agency": ["exact", "icontains"],
        "contract_type": ["exact"],
        "performance_rating": ["exact"],
        "cpars_rating": ["exact"],
        "is_active": ["exact"],
        "on_time_delivery": ["exact"],
        "within_budget": ["exact"],
        "start_date": ["gte", "lte"],
        "end_date": ["gte", "lte"],
        "contract_value": ["gte", "lte"],
    }
    search_fields = [
        "project_name",
        "client_agency",
        "description",
        "contract_number",
        "client_name",
    ]
    ordering_fields = [
        "end_date",
        "start_date",
        "contract_value",
        "performance_rating",
        "created_at",
    ]
    ordering = ["-end_date"]

    def get_queryset(self):
        return PastPerformance.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return PastPerformanceListSerializer
        return PastPerformanceDetailSerializer


class PastPerformanceMatchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for past performance matches.

    Supports filtering by opportunity and relevance_score.
    """
    serializer_class = PastPerformanceMatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        "opportunity": ["exact"],
        "relevance_score": ["gte", "lte"],
    }
    ordering_fields = ["relevance_score", "created_at"]
    ordering = ["-relevance_score"]

    def get_queryset(self):
        return PastPerformanceMatch.objects.select_related(
            "opportunity", "past_performance"
        ).all()
