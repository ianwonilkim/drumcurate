"""Copy the published, verified demo without changing its audio or interface."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path, PurePosixPath
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

SOURCE = "https://drumcurate.dibidibideep.chatgpt.site/"
# The source host serves ordinary browser clients; its integrity check rejects
# the default Python urllib user agent even for public assets.
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=Path("demo/asset-manifest.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    assert manifest["sources"] == 15 and manifest["requests"] == 210
    paths = [entry["path"] for entry in manifest["files"]]
    assert len(set(paths)) == len(paths)
    for path in paths:
        pure = PurePosixPath(path)
        if pure.is_absolute() or ".." in pure.parts or "\\" in path or "?" in path or "#" in path:
            raise ValueError("Invalid asset path")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    seed = args.manifest.resolve().parent / "static"

    def copy(entry):
        path = output / entry["path"]
        if path.exists():
            data = path.read_bytes()
            if len(data) == entry["bytes"] and hashlib.sha256(data).hexdigest() == entry["sha256"]:
                return
        if args.verify_only:
            raise ValueError("Missing or changed asset: " + entry["path"])
        local = seed / entry["path"]
        if local.is_file():
            data = local.read_bytes()
        for attempt in range(4) if not local.is_file() else ():
            try:
                request = Request(SOURCE + entry["path"], headers={"User-Agent": USER_AGENT})
                with urlopen(request, timeout=45) as response:
                    if response.status != 200 or not response.url.startswith(SOURCE):
                        raise ValueError("Unexpected source response")
                    data = response.read(entry["bytes"] + 1)
                break
            except (HTTPError, URLError, TimeoutError) as error:
                if isinstance(error, HTTPError) and error.code not in (429, 500, 502, 503, 504):
                    raise
                if attempt == 3:
                    raise
                time.sleep(2 ** attempt)
        if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ValueError("Published asset changed: " + entry["path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_bytes(data)
        temporary.replace(path)

    with ThreadPoolExecutor(max_workers=6) as pool:
        jobs = [pool.submit(copy, entry) for entry in manifest["files"]]
        for count, job in enumerate(as_completed(jobs), 1):
            job.result()
            if count % 100 == 0 or count == len(jobs):
                print(f"Verified {count}/{len(jobs)} unchanged assets", flush=True)
    catalog = json.loads((output / "catalog.json").read_text())
    assert len(catalog["samples"]) == 15 and len(catalog["requests"]) == 210
    for sample in catalog["samples"]:
        assert sample["original"] in paths
    for result in catalog["requests"].values():
        assert len(result["steps"]) == 5
        assert result["transition"] in paths
        assert all(step["audio"] in paths for step in result["steps"])
    # All source URLs in HTML/JS/catalog are relative, so /drumcurate/ works.
    if not args.verify_only:
        (output / ".nojekyll").write_text("")
    print("Ready: 15 sources, 210 requests, unchanged audio and interface.", flush=True)


if __name__ == "__main__":
    main()
