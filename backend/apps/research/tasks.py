import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def run_research_project(self, project_id: str):
    """
    Execute a research project asynchronously.

    Gathers data from web sources, analyzes findings, and updates the
    ResearchProject with results. Called when a user starts a research
    project via the API.

    Args:
        project_id: UUID string of the ResearchProject to execute.
    """
    from apps.research.models import ResearchProject

    try:
        project = ResearchProject.objects.select_related("deal").get(
            pk=project_id
        )
    except ResearchProject.DoesNotExist:
        logger.error(
            "run_research_project: Project %s not found", project_id
        )
        return

    logger.info(
        "run_research_project: Starting research for project '%s' (type=%s)",
        project.title,
        project.research_type,
    )

    try:
        # TODO: Replace placeholder logic with actual research execution
        # using WebResearcher and CompetitorAnalyzer services.
        #
        # Example flow:
        #   researcher = WebResearcher()
        #   if project.research_type == "market_analysis":
        #       results = await researcher.research_market_trends(...)
        #   elif project.research_type == "agency_analysis":
        #       results = await researcher.analyze_agency(...)
        #   ...
        #
        # For now, populate with placeholder data.

        project.findings = {
            "status": "completed",
            "research_type": project.research_type,
            "summary": (
                f"Research completed for project '{project.title}'. "
                f"This is placeholder data pending API integration."
            ),
            "key_findings": [
                "Finding 1: Placeholder insight based on research parameters.",
                "Finding 2: Market conditions appear favorable.",
                "Finding 3: Further investigation recommended.",
            ],
            "data_quality": "placeholder",
        }

        project.executive_summary = (
            f"Executive Summary for '{project.title}'\n\n"
            f"This research project analyzed {project.get_research_type_display()} "
            f"for the associated deal. Key findings indicate favorable market "
            f"conditions with some areas requiring further investigation.\n\n"
            f"Note: This is placeholder content. Actual AI-generated summaries "
            f"will be produced once research APIs are integrated."
        )

        project.sources = [
            {
                "url": "https://sam.gov/placeholder",
                "title": "SAM.gov Data",
                "relevance_score": 0.92,
                "snippet": "Government procurement data source.",
            },
            {
                "url": "https://fpds.gov/placeholder",
                "title": "FPDS Contract Data",
                "relevance_score": 0.88,
                "snippet": "Federal procurement data system records.",
            },
        ]

        project.status = "completed"
        project.save(
            update_fields=[
                "findings",
                "executive_summary",
                "sources",
                "status",
                "updated_at",
            ]
        )

        logger.info(
            "run_research_project: Project %s completed successfully",
            project_id,
        )

    except Exception as exc:
        logger.exception(
            "run_research_project: Project %s failed with error: %s",
            project_id,
            exc,
        )
        project.status = "failed"
        project.findings = {
            "status": "failed",
            "error": str(exc),
        }
        project.save(update_fields=["status", "findings", "updated_at"])

        # Retry on transient failures
        raise self.retry(exc=exc)
