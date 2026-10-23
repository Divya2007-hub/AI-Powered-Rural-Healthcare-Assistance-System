from triage_engine.evaluation import DEFAULT_CASES, evaluate, render_markdown
from triage_engine.language import SUPPORTED_LANGUAGES


def test_dataset_has_unique_ids_and_all_urgency_classes() -> None:
    ids = [case.case_id for case in DEFAULT_CASES]

    assert len(ids) == len(set(ids))
    assert len(DEFAULT_CASES) >= 30
    assert {case.expected_code for case in DEFAULT_CASES} == {
        "low",
        "consult",
        "urgent",
    }


def test_dataset_covers_supported_languages() -> None:
    languages = {case.language for case in DEFAULT_CASES}

    assert set(SUPPORTED_LANGUAGES) <= languages
    assert "fr" in languages


def test_engine_meets_evaluation_thresholds() -> None:
    report = evaluate()

    assert report.failures == ()
    assert report.thresholds_met is True
    assert report.urgency_accuracy == 1.0
    assert report.urgent_recall == 1.0
    assert report.emergency_recall == 1.0
    assert report.red_flag_recall == 1.0
    assert report.language_accuracy == 1.0


def test_report_renders_metrics_and_failures() -> None:
    markdown = render_markdown(evaluate())

    assert "# Triage Evaluation Report" in markdown
    assert "Urgency accuracy" in markdown
    assert "Red-flag recall" in markdown
    assert "## Failures" in markdown
