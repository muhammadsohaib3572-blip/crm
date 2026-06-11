from app.models.lead import LEAD_STAGE_TRANSITIONS, LeadStage


def test_new_lead_can_move_to_contacted_or_lost():
    allowed = LEAD_STAGE_TRANSITIONS[LeadStage.NEW_LEAD.value]
    assert "CONTACTED" in allowed
    assert "LOST" in allowed


def test_won_is_terminal():
    assert LEAD_STAGE_TRANSITIONS[LeadStage.WON.value] == []


def test_negotiation_can_reopen_proposal():
    allowed = LEAD_STAGE_TRANSITIONS[LeadStage.NEGOTIATION.value]
    assert "WON" in allowed
    assert "PROPOSAL_SENT" in allowed
