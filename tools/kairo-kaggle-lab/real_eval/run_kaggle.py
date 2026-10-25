"""Offline private Kaggle-compatible entrypoint. NOT executed on Kaggle.

No automatic upload, publishing, GPU or network access. Explicitly mount a
reviewed dataset via an authorised Kaggle account first.
"""
import os
from pathlib import Path
from run import main

source=os.environ.get('KAIRO_REVIEWED_SQUAD_PATH','')
if not source or not Path(source).is_file():
    raise SystemExit('A permissioned private dataset mount is required. Kaggle NOT EXECUTED.')
main(['--dataset',source,'--acknowledge-license',
      '--output','/kaggle/working/kairo-relevance-eval.json'])
