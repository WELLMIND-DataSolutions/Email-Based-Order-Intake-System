from bs4 import BeautifulSoup


def html_to_text(content: str) -> str:
    """Convert an email body (plain text or HTML) to plain text for the AI pipeline."""
    if "<" in content and ">" in content:
        soup = BeautifulSoup(content, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    return content.strip()
