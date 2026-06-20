
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

patterns = [
    'Enhanced',
    'enhanced',
    '_v2',
    '.backup',
    '.old',
    '.temp'
]

for file in ROOT.rglob('*'):
    if file.is_file():
        if any(p in file.name for p in patterns):
            print(file)
