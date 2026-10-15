"""
Direct synchronization script for RankCracker Book to Google Docs.
Targets: https://docs.google.com/document/d/1zMT940eozloy03y7FBHSkqNqh9SgnaotPL2v-FWzWoA/edit
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
from pathlib import Path

DOCUMENT_ID = "1zMT940eozloy03y7FBHSkqNqh9SgnaotPL2v-FWzWoA"
DOCS_API_URL = f"https://docs.googleapis.com/v1/documents/{DOCUMENT_ID}"
MASTER_MD_PATH = Path("G:/RankCrackers Project/RankCrackers-55/docs/rankcrackers_book/Rank_Cracker_Book_Complete_Master.md")


def get_access_token() -> str:
    res = subprocess.check_output("gcloud auth application-default print-access-token", shell=True)
    return res.decode().strip()


def check_token_scopes(token: str) -> dict:
    url = f"https://oauth2.googleapis.com/tokeninfo?access_token={token}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def get_document_details(token: str) -> dict:
    req = urllib.request.Request(
        DOCS_API_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def update_document(token: str, text_content: str):
    doc = get_document_details(token)
    title = doc.get("title", "")
    print(f"Connected to Google Doc: '{title}' (ID: {DOCUMENT_ID})")
    
    # Calculate end index of document
    body = doc.get("body", {}).get("content", [])
    end_index = 1
    if body:
        last_elem = body[-1]
        end_index = last_elem.get("endIndex", 1) - 1
    
    requests = []
    
    # If document already has content (> 1 index), delete existing content first
    if end_index > 1:
        print(f"Clearing existing content up to index {end_index}...")
        requests.append({
            "deleteContentRange": {
                "range": {
                    "startIndex": 1,
                    "endIndex": end_index
                }
            }
        })
    
    # Insert new content at index 1
    # Google Docs batchUpdate has payload limits (~1-2MB batch), so we insert in chunks if needed
    print(f"Preparing to insert {len(text_content)} characters...")
    
    # Google Docs batchUpdate
    batch_url = f"{DOCS_API_URL}:batchUpdate"
    
    # 1. First clear if needed
    if requests:
        body_payload = json.dumps({"requests": requests}).encode("utf-8")
        req = urllib.request.Request(
            batch_url,
            data=body_payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            print("Document cleared successfully.")
    
    # 2. Insert in chunks of 50,000 characters from the end or start
    # To keep document order correct when inserting at index 1, we can either append or insert in reverse chunks,
    # or insert chunk 1, get new length, insert at that length.
    chunk_size = 50000
    total_len = len(text_content)
    
    for i in range(0, total_len, chunk_size):
        chunk = text_content[i:i + chunk_size]
        doc_now = get_document_details(token)
        curr_body = doc_now.get("body", {}).get("content", [])
        curr_end = 1
        if curr_body:
            curr_end = curr_body[-1].get("endIndex", 1) - 1
        
        insert_req = {
            "requests": [
                {
                    "insertText": {
                        "location": {"index": curr_end},
                        "text": chunk
                    }
                }
            ]
        }
        req = urllib.request.Request(
            batch_url,
            data=json.dumps(insert_req).encode("utf-8"),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            print(f"Inserted characters {i} to {min(i + chunk_size, total_len)} of {total_len} (at index {curr_end})")

    print("\n[SUCCESS] Entire RankCracker Book uploaded to Google Docs!")


def main():
    print("Checking token and scopes...")
    token = get_access_token()
    info = check_token_scopes(token)
    scopes = info.get("scope", "")
    print(f"Active Account: {info.get('email')}")
    print(f"Active Scopes: {scopes}")
    
    if "https://www.googleapis.com/auth/documents" not in scopes and "https://www.googleapis.com/auth/drive" not in scopes:
        print("\n[ERROR] Missing Google Docs / Drive OAuth scopes in token.")
        print("Please complete the authorization in your browser.")
        sys.exit(1)
        
    print("\nReading master book text...")
    content = MASTER_MD_PATH.read_text(encoding="utf-8")
    print(f"Total characters to sync: {len(content):,}")
    
    update_document(token, content)


if __name__ == "__main__":
    main()
