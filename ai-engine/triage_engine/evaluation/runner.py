"""Evaluation runner for the rule-based triage baseline."""

from __future__ import annotations

from dataclasses import dataclass

from triage_engine.advice import DISCLAIMER
from triage_engine.engine import TriageEngine
from triage_engine.evaluation.cases import DEFAULT_CASES, EvalCase
from triage_engine.language import normalize_language
from triage_engine.models import SymptomRequest

URGENCY_CODES = ("low", "consult", "urgent")

MIN_URGENCY_ACCURACY = 0.9
MIN_URGENT_RECALL = 1.0
MIN_EMERGENCY_RECALL = 1.0
MIN_RED_FLAG_RECALL = 0.95
MIN_LANGUAGE_ACCURACY = 1.0


@dataclass(frozen=True)
class CaseOutcome:
    case: EvalCase
    urgency_code: str
    emergency: bool
    red_flags: tuple[str, ...]
    urgency_correct: bool
    emergency_correct: bool
    red_flag_correct: bool
    language_correct: bool


@dataclass(frozen=True)
class ClassScore:
    expected: int
    correct: int

    @property
    def recall(self) -> float:
        return self.correct / self.expected if self.expected else 1.0


@dataclass(frozen=True)
class EvalReport:
    engine: str
    total: int
    correct: int
    class_scores: dict[str, ClassScore]
    emergency_expected: int
    emergency_true_positives: int
    emergency_predicted: int
    red_flag_expected: int
    red_flag_correct: int
    language_expected: int
    language_correct: int
    failures: tuple[str, ...]

    @property
    def urgency_accuracy(self) -> float:
        return self.correct / self.total if self.total else 1.0

    @property
    def urgent_recall(self) -> float:
        return self.class_scores["urgent"].recall

    @property
    def emergency_recall(self) -> float:
        if not self.emergency_expected:
            return 1.0
        return self.emergency_true_positives / self.emergency_expected

    @property
    def emergency_precision(self) -> float:
        if not self.emergency_predicted:
            return 1.0
        return self.emergency_true_positives / self.emergency_predicted

    @property
    def red_flag_recall(self) -> float:
        if not self.red_flag_expected:
            return 1.0
        return self.red_flag_correct / self.red_flag_expected

    @property
    def language_accuracy(self) -> float:
        if not self.language_expected:
            return 1.0
        return self.language_correct / self.language_expected

    @property
    def thresholds_met(self) -> bool:
        return (
            self.urgency_accuracy >= MIN_URGENCY_ACCURACY
            and self.urgent_recall >= MIN_URGENT_RECALL
            and self.emergency_recall >= MIN_EMERGENCY_RECALL
            and self.red_flag_recall >= MIN_RED_FLAG_RECALL
            and self.language_accuracy >= MIN_LANGUAGE_ACCURACY
        )


def _language_matches(case: EvalCase, result) -> bool:
    if case.language == "en":
        return True

    if normalize_language(case.language) == "en":
        return result.disclaimer == DISCLAIMER
    return result.disclaimer != DISCLAIMER


def run_case(case: EvalCase, engine: TriageEngine) -> CaseOutcome:
    request = SymptomRequest(
        symptoms=case.symptoms,
        duration_days=case.duration_days,
        age_years=case.age_years,
        language=case.language,
    )
    result = engine.assess(request)

    urgency_correct = result.urgency.code == case.expected_code
    emergency_correct = result.emergency is case.expected_emergency
    red_flag_correct = (
        case.expected_red_flag is None
        or case.expected_red_flag in result.red_flags
    )
    language_correct = _language_matches(case, result)

    return CaseOutcome(
        case=case,
        urgency_code=result.urgency.code,
        emergency=result.emergency,
        red_flags=result.red_flags,
        urgency_correct=urgency_correct,
        emergency_correct=emergency_correct,
        red_flag_correct=red_flag_correct,
        language_correct=language_correct,
    )


def _failure_reasons(outcome: CaseOutcome) -> list[str]:
    case = outcome.case
    reasons: list[str] = []

    if not outcome.urgency_correct:
        reasons.append(
            f"urgency {outcome.urgency_code} (expected {case.expected_code})"
        )
    if not outcome.emergency_correct:
        reasons.append(
            f"emergency {outcome.emergency} (expected {case.expected_emergency})"
        )
    if not outcome.red_flag_correct:
        reasons.append(
            f"missing red flag {case.expected_red_flag!r}; "
            f"got {list(outcome.red_flags)!r}"
        )
    if not outcome.language_correct:
        reasons.append(f"language {case.language} not applied")

    return reasons


def evaluate(
    cases: tuple[EvalCase, ...] = DEFAULT_CASES,
    engine: TriageEngine | None = None,
) -> EvalReport:
    triage = engine or TriageEngine()
    outcomes = tuple(run_case(case, triage) for case in cases)

    class_scores: dict[str, ClassScore] = {}
    for code in URGENCY_CODES:
        expected = [outcome for outcome in outcomes if outcome.case.expected_code == code]
        class_scores[code] = ClassScore(
            expected=len(expected),
            correct=sum(1 for outcome in expected if outcome.urgency_correct),
        )

    emergency_cases = [
        outcome for outcome in outcomes if outcome.case.expected_emergency
    ]
    language_cases = [
        outcome
        for outcome in outcomes
        if outcome.case.language.strip().lower() != "en"
    ]

    red_flag_outcomes = [
        outcome for outcome in outcomes if outcome.case.expected_red_flag is not None
    ]

    failures: list[str] = []
    for outcome in outcomes:
        reasons = _failure_reasons(outcome)
        if reasons:
            failures.append(f"{outcome.case.case_id}: " + "; ".join(reasons))

    return EvalReport(
        engine=triage.provider_name,
        total=len(outcomes),
        correct=sum(1 for outcome in outcomes if outcome.urgency_correct),
        class_scores=class_scores,
        emergency_expected=len(emergency_cases),
        emergency_true_positives=sum(
            1
            for outcome in emergency_cases
            if outcome.emergency and outcome.urgency_code == "urgent"
        ),
        emergency_predicted=sum(1 for outcome in outcomes if outcome.emergency),
        red_flag_expected=len(red_flag_outcomes),
        red_flag_correct=sum(
            1 for outcome in red_flag_outcomes if outcome.red_flag_correct
        ),
        language_expected=len(language_cases),
        language_correct=sum(
            1 for outcome in language_cases if outcome.language_correct
        ),
        failures=tuple(failures),
    )


def render_markdown(report: EvalReport) -> str:
    lines = [
        "# Triage Evaluation Report",
        "",
        f"- Engine: `{report.engine}`",
        f"- Golden cases: {report.total}",
        f"- Thresholds met: {'yes' if report.thresholds_met else 'no'}",
        "",
        "## Summary",
        "",
        "| Metric | Value | Threshold |",
        "|---|---|---|",
        f"| Urgency accuracy | {report.urgency_accuracy:.1%} | "
        f">= {MIN_URGENCY_ACCURACY:.0%} |",
        f"| Urgent recall | {report.urgent_recall:.1%} | "
        f">= {MIN_URGENT_RECALL:.0%} |",
        f"| Emergency recall | {report.emergency_recall:.1%} | "
        f">= {MIN_EMERGENCY_RECALL:.0%} |",
        f"| Emergency precision | {report.emergency_precision:.1%} | - |",
        f"| Red-flag recall | {report.red_flag_recall:.1%} | "
        f">= {MIN_RED_FLAG_RECALL:.0%} |",
        f"| Language accuracy | {report.language_accuracy:.1%} | "
        f">= {MIN_LANGUAGE_ACCURACY:.0%} |",
        "",
        "## Urgency by class",
        "",
        "| Class | Expected | Correct | Recall |",
        "|---|---|---|---|",
    ]

    for code in URGENCY_CODES:
        score = report.class_scores[code]
        lines.append(
            f"| {code} | {score.expected} | {score.correct} | {score.recall:.1%} |"
        )

    lines.extend(["", "## Failures", ""])
    if report.failures:
        lines.extend(f"- {failure}" for failure in report.failures)
    else:
        lines.append("None.")

    return "\n".join(lines) + "\n"
