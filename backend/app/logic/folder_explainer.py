import base64
import pathlib
import re

# Pictures that are shown to Gemini when a folder is explained (size cap in bytes).
IMAGE_MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
MAX_IMAGE_BYTES = 4_000_000


def folder_parts(docs_dir: pathlib.Path, rel: str) -> list | None:
    """Gemini message parts explaining one folder of ``docs_dir``: a text prompt
    listing its contents plus its pictures. Links and PDFs go by name. Returns
    None when ``rel`` is not a folder inside ``docs_dir``."""
    root = docs_dir.resolve()
    folder = (root / rel).resolve()
    if not folder.is_dir() or (folder != root and root not in folder.parents):
        return None
    lines, images = [], []
    for f in sorted(folder.iterdir()):
        ext = f.suffix.lower()
        if f.is_dir():
            lines.append(f"- {f.name} (subfolder)")
        elif ext == ".url":
            link = re.search(r"^URL=(.+)$", f.read_text(encoding="utf-8", errors="ignore"), re.M)
            lines.append(f"- {f.stem} (link to {link.group(1).strip() if link else 'a website'})")
        elif ext in IMAGE_MIME and f.stat().st_size <= MAX_IMAGE_BYTES:
            lines.append(f"- {f.name} (picture, attached)")
            images.append({"inline_data": {
                "mime_type": IMAGE_MIME[ext],
                "data": base64.b64encode(f.read_bytes()).decode(),
            }})
        else:
            lines.append(f"- {f.name} ({ext[1:].upper() or 'file'})")
    prompt = (
        f"The visitor opened the folder '{rel or 'docs'}'. It contains:\n" + "\n".join(lines) + "\nExplain out loud what is inside this folder, "
        "drawing on the parts of the knowledge above (the markdown notes) that are relevant to "
        "it, the attached pictures for what they show, and the names or titles for links "
        "and PDFs. Start straight with the explanation: no greeting, no welcome, no mention "
        "of the portfolio or of the visitor, and no closing question. Speak once, as a "
        "short paragraph, in English."
    )
    return [{"text": prompt}, *images]
