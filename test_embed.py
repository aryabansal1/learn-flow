import urllib.request
import xml.etree.ElementTree as ET
import webbrowser
import os

QUERY = "attention is all you need transformer"
NS = {"atom": "http://www.w3.org/2005/Atom"}

url = f"https://export.arxiv.org/api/query?search_query=all:{QUERY.replace(' ', '+')}&max_results=1&sortBy=relevance"
print(f"Fetching: {url}")

with urllib.request.urlopen(url, timeout=15) as response:
    xml = response.read()

root = ET.fromstring(xml)
entry = root.find("atom:entry", NS)

title = entry.find("atom:title", NS).text.strip()
id_url = entry.find("atom:id", NS).text.strip()
arxiv_id = id_url.split("/abs/")[-1].split("v")[0]

pdf_link = None
for link in entry.findall("atom:link", NS):
    if link.attrib.get("title") == "pdf":
        pdf_link = link.attrib["href"]
        break

print(f"Found: {title} ({arxiv_id})")
print(f"PDF: {pdf_link}")

embed_url = f"https://docs.google.com/viewer?url={pdf_link}&embedded=true"

html = f"""<!DOCTYPE html>
<html>
<head>
  <title>{title}</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: sans-serif; background: #f5f5f5; }}
    header {{ background: white; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }}
    h1 {{ font-size: 16px; color: #111; }}
    p {{ font-size: 12px; color: #6b7280; margin-top: 4px; }}
    iframe {{ width: 100%; height: calc(100vh - 70px); border: none; display: block; }}
  </style>
</head>
<body>
  <header>
    <h1>{title}</h1>
    <p>arXiv:{arxiv_id} &mdash; <a href="{pdf_link}" target="_blank">Open PDF directly</a></p>
  </header>
  <iframe src="{embed_url}"></iframe>
</body>
</html>"""

out = os.path.join(os.path.dirname(__file__), "test_embed.html")
with open(out, "w") as f:
    f.write(html)

print(f"Opening browser...")
webbrowser.open(f"file://{out}")
