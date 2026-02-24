from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PastPerformanceMatchViewSet, PastPerformanceViewSet

router = DefaultRouter()
router.register(r"past-performance", PastPerformanceViewSet, basename="past-performance")
router.register(r"past-performance-matches", PastPerformanceMatchViewSet, basename="past-performance-match")

urlpatterns = [
    path("", include(router.urls)),
]
