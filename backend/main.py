from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
import asyncio
import urllib.request
import xml.etree.ElementTree as ET

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

NS = {"atom": "http://www.w3.org/2005/Atom"}
executor = ThreadPoolExecutor(max_workers=4)

def _search(query: str, retries: int = 3):
    url = f"https://export.arxiv.org/api/query?search_query=all:{query.replace(' ', '+')}&max_results=1&sortBy=relevance"
    req = urllib.request.Request(url, headers={"User-Agent": "LearnFlow/1.0"})

    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                xml = response.read()
            break
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                import time
                time.sleep(5 * (attempt + 1))
                continue
            raise
        except TimeoutError:
            if attempt < retries - 1:
                import time
                time.sleep(3)
                continue
            raise

    root = ET.fromstring(xml)
    entry = root.find("atom:entry", NS)
    if entry is None:
        return None

    title = entry.find("atom:title", NS).text.strip()
    id_url = entry.find("atom:id", NS).text.strip()
    arxiv_id = id_url.split("/abs/")[-1].split("v")[0]
    abstract = entry.find("atom:summary", NS).text.strip()

    pdf_link = None
    for link in entry.findall("atom:link", NS):
        if link.attrib.get("title") == "pdf":
            pdf_link = link.attrib["href"]
            break

    return {"arxivId": arxiv_id, "title": title, "abstract": abstract, "pdfLink": pdf_link}

@app.get("/api/search")
async def search_papers(query: str = Query(...)):
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(executor, _search, query)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    if not result:
        raise HTTPException(status_code=404, detail="No papers found")
    return result
