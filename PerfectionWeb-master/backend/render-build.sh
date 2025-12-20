#!/usr/bin/env bash
set -euo pipefail
echo "Using Python: $(python --version)"
python -m pip install --upgrade pip setuptools wheel
# Install binary wheels for numpy and pandas to avoid source builds (requires wheels available)
python -m pip install --prefer-binary --only-binary=:all: numpy pandas || true
# Then install the rest of the requirements (skip numpy/pandas because they were removed from requirements)
python -m pip install -r requirements.txt
echo "Dependencies installed successfully"
