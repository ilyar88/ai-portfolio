import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from app.logs.logger import get_logger

logger = get_logger(__name__)


def _default_root() -> Path:
    """`frontend/public` relative to the repo root.

    This file lives at ``backend/app/controllers/files_router.py`` so the repo
    root is three parents up.
    """
    return Path(__file__).resolve().parents[3] / "frontend" / "public"


class FilesRouter:
    """Read-only file browser scoped to a single root directory.

    The root defaults to ``frontend/public`` and can be overridden with the
    ``FILES_ROOT`` environment variable. Only GET access is exposed and every
    request is confined to the root (no path traversal).
    """

    def __init__(self):
        self.router = APIRouter()
        configured = os.getenv("FILES_ROOT")
        self.root = Path(configured).resolve() if configured else _default_root().resolve()
        if not self.root.is_dir():
            logger.warning("FILES_ROOT %s is not a directory - /files will 404", self.root)
        self.router.add_api_route("/files/list", self._list, methods=["GET"])
        self.router.add_api_route("/files/raw", self._raw, methods=["GET"])

    def _resolve(self, rel: str) -> Path:
        """Resolve a client-supplied relative path inside the root or raise 404."""
        rel = (rel or "").strip().replace("\\", "/").lstrip("/")
        target = (self.root / rel).resolve()
        if target != self.root and self.root not in target.parents:
            raise HTTPException(status_code=404, detail="Path not found")
        if not target.exists():
            raise HTTPException(status_code=404, detail="Path not found")
        return target

    def _entry(self, path: Path) -> dict:
        is_dir = path.is_dir()
        size = None
        modified = None
        try:
            stat = path.stat()
            modified = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
            if not is_dir:
                size = stat.st_size
        except OSError:
            pass
        item_count = None
        if is_dir:
            try:
                item_count = sum(1 for c in path.iterdir() if not c.name.startswith("."))
            except OSError:
                item_count = None
        return {
            "name": path.name,
            "type": "dir" if is_dir else "file",
            "size": size,
            "modified": modified,
            "ext": "" if is_dir else path.suffix.lower().lstrip("."),
            "itemCount": item_count,
        }

    async def _list(self, path: str = Query("")):
        """List one directory: folders first, then files, alphabetically.

        The root only lists folders; files show up once you open a folder.
        """
        target = self._resolve(path)
        if not target.is_dir():
            raise HTTPException(status_code=400, detail="Not a directory")
        try:
            children = [c for c in target.iterdir() if not c.name.startswith(".")]
        except OSError:
            raise HTTPException(status_code=403, detail="Cannot read directory")
        if target == self.root:
            children = [c for c in children if c.is_dir()]
        children.sort(key=lambda p: (p.is_file(), p.name.lower()))

        rel = target.relative_to(self.root)
        rel_str = "" if rel == Path(".") else rel.as_posix()
        parent = None
        if rel_str:
            parent_rel = rel.parent
            parent = "" if parent_rel == Path(".") else parent_rel.as_posix()

        crumbs = []
        acc = ""
        for part in rel.parts:
            acc = f"{acc}/{part}" if acc else part
            crumbs.append({"name": part, "path": acc})

        return {
            "path": rel_str,
            "parent": parent,
            "breadcrumb": crumbs,
            "entries": [self._entry(c) for c in children],
        }

    async def _raw(self, path: str = Query(...), download: bool = Query(False)):
        """Stream a single file for preview (inline) or download (attachment)."""
        target = self._resolve(path)
        if not target.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(
            target,
            filename=target.name,
            content_disposition_type="attachment" if download else "inline",
        )
