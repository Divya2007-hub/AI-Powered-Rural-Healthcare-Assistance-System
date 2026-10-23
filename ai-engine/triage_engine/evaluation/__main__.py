import argparse
from pathlib import Path

from triage_engine.evaluation.runner import evaluate, render_markdown


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the triage engine.")
    parser.add_argument(
        "--output",
        type=Path,
        help="Write the markdown report to this path.",
    )
    args = parser.parse_args()

    report = evaluate()
    markdown = render_markdown(report)
    print(markdown)

    if args.output:
        args.output.write_text(markdown, encoding="utf-8")

    return 0 if report.thresholds_met else 1


if __name__ == "__main__":
    raise SystemExit(main())
