import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def process_qa_impacts():
    """
    Process clarification answers that impact proposals.

    Finds all ClarificationAnswers marked as impacts_proposal=True
    that don't yet have QAImpactMapping entries, and creates
    placeholder impact mappings for review.
    """
    from .models import ClarificationAnswer, QAImpactMapping

    answers_with_impact = ClarificationAnswer.objects.filter(
        impacts_proposal=True,
    ).exclude(
        impact_mappings__isnull=False,
    )

    created_count = 0
    for answer in answers_with_impact:
        # Check if any impact mappings already exist for this answer
        if answer.impact_mappings.exists():
            continue

        QAImpactMapping.objects.create(
            answer=answer,
            proposal_section="TBD - Requires Review",
            impact_description=(
                f"Answer to Q{answer.question.question_number or 'N/A'} "
                f"may impact the proposal. Review required."
            ),
            action_required="Review answer and determine proposal impact.",
            status="pending",
        )
        created_count += 1

    logger.info(
        "process_qa_impacts completed: %d impact mappings created", created_count
    )
    return {"created": created_count}
