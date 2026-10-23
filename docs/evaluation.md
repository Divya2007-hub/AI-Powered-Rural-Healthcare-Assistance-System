# Triage Evaluation

The triage engine is evaluated against a small, hand-checked set of golden cases.
This is a regression and research baseline, **not clinical validation**.

## Run it

```bash
cd ai-engine
python -m triage_engine.evaluation
```

The command prints a markdown report and exits with status `1` if any threshold
fails. The harness lives in `triage_engine/evaluation/`:

- `cases.py` — the golden dataset (`DEFAULT_CASES`).
- `runner.py` — runs each case, computes metrics, and renders the report.
- `__main__.py` — command-line entry point (`--output` writes the report to a file).

## Dataset

44 cases, each with an expected urgency code and optional emergency/red-flag and
language expectations:

| Group | Cases |
|---|---|
| Low urgency (mild, self-limiting) | 4 |
| Medical consultation recommended | 26 |
| Urgent care required | 14 |
| Non-English replies (hi, kn, ta, te, mr) | 6 |
| Unsupported language fallback (fr) | 1 |

Coverage includes every emergency category in
`triage_engine/safety/red_flags.py`, unknown symptoms, long-lasting symptoms,
vulnerable ages, a hidden red flag inside a mild-looking combination, and
localized replies.

## Metrics

- **Urgency accuracy** — exact match with the expected code.
- **Per-class recall** — correctness for `low`, `consult`, and `urgent` cases.
- **Emergency recall** — expected emergencies that were escalated.
- **Emergency precision** — escalations that were expected.
- **Red-flag recall** — expected warning labels present in the result.
- **Language accuracy** — localized replies for supported languages and English
  fallback for unsupported codes.

## Latest results

Engine: `rule-based-v1` · 44 cases · thresholds met: yes

| Metric | Value | Threshold |
|---|---|---|
| Urgency accuracy | 100.0% | >= 90% |
| Urgent recall | 100.0% | >= 100% |
| Emergency recall | 100.0% | >= 100% |
| Emergency precision | 100.0% | - |
| Red-flag recall | 100.0% | >= 95% |
| Language accuracy | 100.0% | >= 100% |

| Class | Expected | Correct | Recall |
|---|---|---|---|
| low | 4 | 4 | 100.0% |
| consult | 26 | 26 | 100.0% |
| urgent | 14 | 14 | 100.0% |

Failures: none.

## Interpretation and limitations

- The dataset is small and written by the project team. It checks expected
  behavior; it does not establish clinical safety or accuracy.
- The rule-based provider matches English keywords. The multilingual cases send
  English symptom words and expect a localized reply, so they test output
  localization and safety escalation, not non-English symptom understanding.
- The low-urgency class is intentionally small: most recognizable symptoms are
  routed to consultation to avoid under-triage.
- A future provider (for example an LLM or ML model) can be compared by passing
  it to `TriageEngine(provider=...)` and re-running the harness; the safety layer
  and thresholds stay the same.
- The next research step is an external, clinician-reviewed dataset and
  agreement analysis (for example Cohen's kappa) rather than only exact-match
  accuracy.
