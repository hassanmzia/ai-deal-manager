from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class KnowledgeDocument(BaseModel):
    """Knowledge vault document for storing templates, guides, and reference materials."""

    CATEGORY_CHOICES = [
        ("template", "Template"),
        ("guide", "Guide"),
        ("best_practice", "Best Practice"),
        ("case_study", "Case Study"),
        ("regulatory_reference", "Regulatory Reference"),
        ("tool", "Tool"),
        ("lesson_learned", "Lesson Learned"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("review", "In Review"),
        ("approved", "Approved"),
        ("archived", "Archived"),
    ]

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    content = models.TextField()
    file_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    tags = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="knowledge_documents_authored",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="knowledge_documents_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    version = models.CharField(max_length=50, default="1.0")
    related_documents = models.ManyToManyField(
        "self", symmetrical=False, blank=True, related_name="related_to"
    )
    is_public = models.BooleanField(default=False)
    downloads = models.IntegerField(default=0)
    views = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Knowledge Document"
        verbose_name_plural = "Knowledge Documents"

    def __str__(self):
        return f"{self.title} [{self.get_category_display()}]"
