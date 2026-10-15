#!/usr/bin/env python3
"""Local, offline mock for tests ONLY. Never shipped to GH workflow."""
import hashlib
import os
from pathlib import Path
import shutil
import sys

root = Path(os.environ['FAKE_RCLONE_ROOT'])
args = sys.argv[1:]
op = args[0]

def resolve(s):
    if not s.startswith('gdrive:'):
        return Path(s)
    rest = s[len('gdrive:'):].lstrip('/')
    return root / rest

if op == 'mkdir':
    resolve(args[1]).mkdir(parents=True, exist_ok=True)
elif op == 'lsf':
    folder = resolve(args[1])
    if not folder.is_dir():
        raise SystemExit('missing folder')
    for p in sorted(folder.iterdir()):
        if p.is_dir():
            print(p.name + '/')
elif op == 'copy':
    source, target = resolve(args[1]), resolve(args[2])
    target.mkdir(parents=True, exist_ok=True)
    for item in source.rglob('*'):
        if item.is_file():
            dest = target / item.relative_to(source)
            dest.parent.mkdir(parents=True, exist_ok=True)
            if dest.exists():
                raise SystemExit('immutable violation')
            shutil.copy2(item, dest)
elif op == 'check':
    if os.environ.get('FAKE_RCLONE_FAIL_CHECK') == 'true':
        raise SystemExit('forced remote validation failure')
    source, target = resolve(args[1]), resolve(args[2])
    for item in source.rglob('*'):
        if item.is_file():
            dest = target / item.relative_to(source)
            if not dest.is_file() or hashlib.sha256(item.read_bytes()).digest() != hashlib.sha256(dest.read_bytes()).digest():
                raise SystemExit('remote verification mismatch')
elif op == 'copyto':
    source, target = resolve(args[1]), resolve(args[2])
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise SystemExit('immutable violation')
    shutil.copy2(source, target)
else:
    raise SystemExit('unknown mock command ' + op)
