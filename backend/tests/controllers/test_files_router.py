import pytest
from fastapi import HTTPException
from fastapi.responses import FileResponse

from app.controllers.files_router import FilesRouter


@pytest.fixture
def files_root(tmp_path):
    """A small directory tree to browse."""
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs" / "note.md").write_text("hello")
    (tmp_path / "readme.txt").write_text("root file")
    (tmp_path / ".hidden").write_text("secret")
    return tmp_path


@pytest.fixture
def files_router(files_root, monkeypatch):
    monkeypatch.setenv("FILES_ROOT", str(files_root))
    return FilesRouter()


@pytest.mark.unit
def test_router_initialization(files_router):
    route_methods = {route.path: set(route.methods) for route in files_router.router.routes}
    assert route_methods == {"/files/list": {"GET"}, "/files/raw": {"GET"}}


@pytest.mark.unit
async def test_list_root(files_router):
    result = await files_router._list("")
    assert result["path"] == ""
    assert result["parent"] is None
    names = [e["name"] for e in result["entries"]]
    # root lists folders only; hidden entries skipped
    assert names == ["docs"]
    assert result["entries"][0]["type"] == "dir"
    assert result["entries"][0]["itemCount"] == 1


@pytest.mark.unit
async def test_list_subdirectory(files_router):
    result = await files_router._list("docs")
    assert result["path"] == "docs"
    assert result["parent"] == ""
    assert result["breadcrumb"] == [{"name": "docs", "path": "docs"}]
    assert [e["name"] for e in result["entries"]] == ["note.md"]
    assert result["entries"][0]["ext"] == "md"


@pytest.mark.unit
async def test_list_rejects_path_traversal(files_router):
    with pytest.raises(HTTPException) as exc:
        await files_router._list("../../etc")
    assert exc.value.status_code == 404


@pytest.mark.unit
async def test_list_missing_path(files_router):
    with pytest.raises(HTTPException) as exc:
        await files_router._list("nope")
    assert exc.value.status_code == 404


@pytest.mark.unit
async def test_raw_serves_file(files_router):
    response = await files_router._raw("readme.txt", False)
    assert isinstance(response, FileResponse)
    assert response.filename == "readme.txt"


@pytest.mark.unit
async def test_raw_download_sets_attachment(files_router):
    response = await files_router._raw("readme.txt", True)
    assert "attachment" in response.headers["content-disposition"]


@pytest.mark.unit
async def test_raw_rejects_directory(files_router):
    with pytest.raises(HTTPException) as exc:
        await files_router._raw("docs", False)
    assert exc.value.status_code == 404
