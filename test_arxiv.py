import urllib.request
import xml.etree.ElementTree as ET

QUERY = "attention is all you need transformer"
NS = {"atom": "http://www.w3.org/2005/Atom"}

url = f"https://export.arxiv.org/api/query?search_query=all:{QUERY.replace(' ', '+')}&max_results=1&sortBy=relevance"
print(f"Fetching: {url}\n")

with urllib.request.urlopen(url, timeout=15) as response:
    xml = response.read()

root = ET.fromstring(xml)
entry = root.find("atom:entry", NS)

if entry is None:
    print("No results found.")
else:
    title = entry.find("atom:title", NS).text.strip()
    id_url = entry.find("atom:id", NS).text.strip()
    arxiv_id = id_url.split("/abs/")[-1].split("v")[0]

    pdf_link = None
    for link in entry.findall("atom:link", NS):
        if link.attrib.get("title") == "pdf":
            pdf_link = link.attrib["href"]
            break

    print(f"Title:     {title}")
    print(f"arXiv ID:  {arxiv_id}")
    print(f"PDF link:  {pdf_link}")
