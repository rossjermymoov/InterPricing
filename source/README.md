# Source

`build_calc.py` regenerates `../index.html` from `calc_payload.json` (rates data) plus an inlined Chart.js.

Regenerate:
```
pip install chart.js is npm; node module chart.js provides dist/chart.umd.js
python3 build_calc.py   # writes dpd_vs_ups_calculator.html -> copy to ../index.html
```
