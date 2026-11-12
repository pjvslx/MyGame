"""Extract the approved v9 flat concept into reusable Cocos 3.8 UI sprites.

Run from any directory with Pillow installed. Only the owned deep-mining texture
directory, its directory metadata, and the extraction manifest are written.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import uuid
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design/concepts/deep-mining-concept-v9.png"
SOURCE_SHA256 = "854c4ab3dde62a0bf6f478d4b919510823f39a203d820ba7a63b83224fdb28f1"
OUTPUT = ROOT / "Cocos/assets/diamond/res/texture/deep-mining"
MANIFEST = ROOT / "design/deep-mining-assets.json"
IMAGE_META_TEMPLATE = ROOT / "Cocos/assets/sub-package/img/diamond/r1.png.meta"
DIRECTORY_META_TEMPLATE = ROOT / "Cocos/assets/diamond/res/img.meta"
RESAMPLE = Image.Resampling.LANCZOS


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def stable_uuid(path: Path) -> str:
    meta = path.with_name(path.name + ".meta")
    if meta.exists():
        return json.loads(meta.read_text(encoding="utf-8-sig"))["uuid"]
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "mygame/deep-mining/v9/" + path.name))


def directory_meta(path: Path) -> None:
    meta_path = path.with_name(path.name + ".meta")
    if meta_path.exists():
        return
    data = json.loads(DIRECTORY_META_TEMPLATE.read_text(encoding="utf-8-sig"))
    data["uuid"] = stable_uuid(path)
    write_json(meta_path, data)


def image_meta(path: Path, size: tuple[int, int], border: int = 0, packable: bool = True) -> dict:
    data = copy.deepcopy(json.loads(IMAGE_META_TEMPLATE.read_text(encoding="utf-8-sig")))
    asset_uuid = stable_uuid(path)
    data["uuid"] = asset_uuid
    data["userData"]["redirect"] = asset_uuid + "@6c48a"
    data["userData"]["hasAlpha"] = True
    texture = data["subMetas"]["6c48a"]
    texture["uuid"] = asset_uuid + "@6c48a"
    texture["displayName"] = path.stem
    texture["userData"]["imageUuidOrDatabaseUri"] = asset_uuid
    frame = data["subMetas"]["f9941"]
    frame["uuid"] = asset_uuid + "@f9941"
    frame["displayName"] = path.stem
    width, height = size
    user = frame["userData"]
    user.update({
        "trimType": "custom", "offsetX": 0, "offsetY": 0,
        "trimX": 0, "trimY": 0, "width": width, "height": height,
        "rawWidth": width, "rawHeight": height,
        "borderTop": border, "borderBottom": border,
        "borderLeft": border, "borderRight": border,
        "imageUuidOrDatabaseUri": asset_uuid + "@6c48a",
        "packable": packable,
        "vertices": {
            "rawPosition": [-width / 2, -height / 2, 0, width / 2, -height / 2, 0,
                            -width / 2, height / 2, 0, width / 2, height / 2, 0],
            "indexes": [0, 1, 2, 2, 1, 3],
            "uv": [0, height, width, height, 0, 0, width, 0],
            "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
            "minPos": [-width / 2, -height / 2, 0],
            "maxPos": [width / 2, height / 2, 0],
        },
    })
    write_json(path.with_name(path.name + ".meta"), data)
    return {"uuid": asset_uuid, "textureUuid": texture["uuid"], "spriteFrameUuid": frame["uuid"]}


def fill_mask_holes(mask: Image.Image) -> Image.Image:
    width, height = mask.size
    pixels = mask.load()
    outside = set()
    pending = deque()
    for x in range(width):
        pending.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        pending.extend(((0, y), (width - 1, y)))
    while pending:
        x, y = pending.popleft()
        if not (0 <= x < width and 0 <= y < height) or (x, y) in outside or pixels[x, y]:
            continue
        outside.add((x, y))
        pending.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    result = Image.new("L", mask.size, 255)
    output = result.load()
    for x, y in outside:
        output[x, y] = 0
    return result


def largest_mask_component(mask: Image.Image) -> Image.Image:
    pending_pixels = {(x, y) for y in range(mask.height) for x in range(mask.width) if mask.getpixel((x, y))}
    largest = set()
    while pending_pixels:
        seed = pending_pixels.pop()
        component = {seed}
        queue = deque([seed])
        while queue:
            x, y = queue.popleft()
            for neighbor in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if neighbor in pending_pixels:
                    pending_pixels.remove(neighbor)
                    component.add(neighbor)
                    queue.append(neighbor)
        if len(component) > len(largest):
            largest = component
    result = Image.new("L", mask.size)
    for point in largest:
        result.putpixel(point, 255)
    return result


def color_cutout(source: Image.Image, box: tuple[int, int, int, int], kind: str, fill_holes: bool = True, largest_only: bool = False) -> Image.Image:
    crop = source.crop(box).convert("RGBA")
    mask = Image.new("L", crop.size)
    alpha = mask.load()
    for y in range(crop.height):
        for x in range(crop.width):
            red, green, blue, _ = crop.getpixel((x, y))
            high, low = max(red, green, blue), min(red, green, blue)
            visible = high > 80 and high - low > 45
            if kind == "cyan":
                visible = blue > 75 and blue > red * 1.25 and green > red * 1.1
            elif kind == "blue":
                visible = (blue > 90 and blue > red * 1.12 and blue > green * 0.82) or (high > 190 and high - low < 40)
            elif kind == "gold":
                visible = red > 90 and red > blue * 1.7 and green > blue * 1.4
            if visible:
                alpha[x, y] = 255
    if largest_only:
        mask = largest_mask_component(mask)
    if fill_holes:
        mask = fill_mask_holes(mask)
    crop.putalpha(mask.filter(ImageFilter.GaussianBlur(0.25)))
    if kind == "blue":
        for y in range(crop.height):
            for x in range(crop.width):
                red, green, blue, alpha = crop.getpixel((x, y))
                if red > blue * 1.12 and red > green * 1.12:
                    crop.putpixel((x, y), (0, 0, 0, 0))
    bounds = crop.getbbox()
    if not bounds:
        raise ValueError(f"Empty color separation for {box}")
    return crop.crop(bounds)


def centered(image: Image.Image, size: tuple[int, int], inset: int = 2) -> Image.Image:
    result = Image.new("RGBA", size)
    fitted = image.copy()
    fitted.thumbnail((size[0] - inset * 2, size[1] - inset * 2), RESAMPLE)
    result.alpha_composite(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
    return result


def polygon_cutout(source: Image.Image, box: tuple[int, int, int, int], points: list[tuple[int, int]]) -> Image.Image:
    crop = source.crop(box).convert("RGBA")
    mask = Image.new("L", (crop.width * 4, crop.height * 4))
    ImageDraw.Draw(mask).polygon([(x * 4, y * 4) for x, y in points], fill=255)
    crop.putalpha(mask.resize(crop.size, RESAMPLE))
    return crop


def copper_corner(source: Image.Image, box: tuple[int, int, int, int], points: list[tuple[int, int]], side: str) -> Image.Image:
    crop = polygon_cutout(source, box, points)
    bolt_x = 13 if side == "left" else 38
    for y in range(crop.height):
        for x in range(crop.width):
            red, green, blue, alpha = crop.getpixel((x, y))
            in_bolt = (x - bolt_x) ** 2 + (y - 13) ** 2 < 49
            if not in_bolt and blue > red * 1.25 and blue > green * 1.05:
                crop.putpixel((x, y), (red, green, blue, 0))
    return crop


def outline() -> Image.Image:
    shape = Image.new("L", (270, 270))
    draw = ImageDraw.Draw(shape)
    draw.rounded_rectangle((15, 15, 254, 254), radius=24, outline=255, width=7)
    core = shape.resize((90, 90), RESAMPLE)
    glow = core.filter(ImageFilter.GaussianBlur(3))
    result = Image.new("RGBA", (90, 90), (255, 119, 12, 0))
    result.putalpha(glow.point(lambda value: min(220, value * 3)))
    line = Image.new("RGBA", (90, 90), (255, 214, 77, 0))
    line.putalpha(core)
    result.alpha_composite(line)
    return result


def work_line() -> Image.Image:
    result = Image.new("RGBA", (128, 14))
    draw = ImageDraw.Draw(result)
    for y, color in enumerate([(255, 123, 0, 0), (255, 139, 0, 18), (255, 153, 0, 40),
                               (255, 164, 0, 90), (255, 187, 0, 170), (255, 220, 36, 255),
                               (255, 255, 154, 255), (255, 246, 98, 255), (255, 209, 0, 230),
                               (255, 170, 0, 135), (255, 146, 0, 65), (255, 133, 0, 25)]):
        draw.line((0, y + 1, 127, y + 1), fill=color)
    return result


def hud_panel() -> Image.Image:
    result = Image.new("RGBA", (256, 36))
    draw = ImageDraw.Draw(result)
    draw.polygon([(7, 0), (248, 0), (255, 7), (253, 29), (248, 35), (7, 35), (0, 28), (0, 7)], fill=(56, 49, 50, 255))
    draw.line([(7, 1), (248, 1), (254, 7), (252, 29), (248, 34), (7, 34), (1, 28), (1, 7), (7, 1)], fill=(138, 115, 105, 255), width=2)
    draw.line((8, 4, 247, 4), fill=(192, 150, 120, 255))
    draw.polygon([(8, 6), (247, 6), (249, 9), (248, 28), (7, 28), (6, 9)], fill=(36, 36, 43, 255))
    return result


def hard_stone(base: Image.Image, level: int) -> Image.Image:
    palettes = [((52, 36, 30), (146, 105, 76)), ((48, 43, 40), (130, 124, 108)),
                ((42, 43, 47), (112, 117, 122)), ((39, 34, 42), (103, 86, 104))]
    dark, light = palettes[level - 1]
    result = ImageOps.colorize(ImageOps.grayscale(base), dark, light).convert("RGBA")
    cracks = Image.new("RGBA", (270, 270))
    draw = ImageDraw.Draw(cracks)
    paths = [[(9, 5), (31, 26), (27, 46), (46, 62), (41, 87)],
             [(31, 26), (55, 22), (68, 38), (86, 37)],
             [(27, 46), (8, 61), (6, 79)],
             [(46, 62), (71, 59), (84, 79)]]
    for points in paths[:5 - level]:
        scaled = [(x * 3, y * 3) for x, y in points]
        draw.line(scaled, fill=(40, 27, 25, 245), width=7, joint="curve")
        draw.line([(x - 2, y - 2) for x, y in scaled], fill=(184, 146, 105, 130), width=2)
    if level == 4:
        draw.line([(27, 15), (96, 78), (81, 138), (138, 186), (123, 261)], fill=(247, 134, 36, 230), width=5)
    result.alpha_composite(cracks.resize((90, 90), RESAMPLE))
    return result


def wall_strip(source: Image.Image, box: tuple[int, int, int, int], side: str) -> Image.Image:
    part = source.crop(box).convert("RGBA")
    mask = Image.new("L", part.size)
    for y in range(part.height):
        candidates = []
        for x in range(part.width):
            red, green, blue, _ = part.getpixel((x, y))
            if max(red, green, blue) > 45 and (blue > red * 1.05 or red > blue * 1.1):
                candidates.append(x)
        if side == "left":
            extent = max(candidates) + 1 if candidates else 8
            limits = range(0, max(8, extent))
        else:
            extent = min(candidates) if candidates else part.width - 8
            limits = range(min(part.width - 8, extent), part.width)
        for x in limits:
            mask.putpixel((x, y), 255)
    part.putalpha(mask)
    part = part.resize((64, 256), RESAMPLE)
    result = Image.new("RGBA", (64, 512))
    result.alpha_composite(part, (0, 0))
    result.alpha_composite(ImageOps.flip(part), (0, 256))
    return result


def shaft_backdrop(source: Image.Image) -> Image.Image:
    sample = source.crop((100, 105, 450, 212)).resize((8, 256), RESAMPLE).convert("RGBA")
    return sample


def export(preview: Path | None, only: set[str] | None = None) -> None:
    if sha256(SOURCE) != SOURCE_SHA256:
        raise ValueError("The approved v9 concept content changed; update the extraction plan explicitly.")
    source = Image.open(SOURCE).convert("RGBA")
    if source.size != (1536, 1024):
        raise ValueError("The approved v9 concept dimensions changed; update the extraction plan explicitly.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    directory_meta(OUTPUT.parent)
    directory_meta(OUTPUT)
    records = {}
    images = {}
    previous_records = json.loads(MANIFEST.read_text(encoding="utf-8"))["assets"] if only and MANIFEST.exists() else {}

    def emit(name: str, image: Image.Image, boxes: list[list[int]], alpha: str, reconstruction: str = "", border: int = 0, packable: bool = True) -> None:
        if image.getbbox() is None:
            raise ValueError(f"Empty output {name}")
        images[name] = image
        if only and name not in only:
            records[name] = previous_records[name]
            return
        path = OUTPUT / (name + ".png")
        image.convert("RGBA").save(path, optimize=True)
        identifiers = image_meta(path, image.size, border, packable)
        records[name] = {
            "path": path.relative_to(ROOT).as_posix(), "sourceBoxes": boxes,
            "sourceScreen": [0, 0, 512, 1024], "dimensions": list(image.size),
            "alphaBBox": list(image.getbbox()), "alphaMethod": alpha,
            "reconstruction": reconstruction, "nineSlice": [border] * 4,
            "sha256": sha256(path), "bytes": path.stat().st_size, **identifiers,
        }

    gems = {"green": (165, 240, 212, 291), "red": (376, 240, 425, 291),
            "blue": (270, 239, 319, 291), "yellow": (111, 240, 160, 291),
            "purple": (218, 240, 266, 291)}
    for color, box in gems.items():
        kind = "blue" if color == "blue" else "gem"
        emit("gem-" + color, centered(color_cutout(source, box, kind, largest_only=True), (56, 56)), [list(box)], "Largest connected chroma/value silhouette, closed inner holes; centered without aspect distortion. Blue uses blue/cyan/white classification and rejects red contamination.")

    soil_boxes = [(58, 673, 110, 725), (111, 673, 163, 725), (218, 673, 270, 725)]
    bases = []
    for index, box in enumerate(soil_boxes, 1):
        base = source.crop(box).resize((90, 90), RESAMPLE)
        bases.append(base)
        emit(f"soil-base-{index:02d}", base, [list(box)], "Opaque clean soil cell, no target glow or treasure.")
    for level in range(1, 5):
        emit(f"soil-hard-{level:02d}", hard_stone(bases[0], level), [list(soil_boxes[0])], "Opaque derived soil cell.", "The concept contains no four durability states. Source soil recolored into stone palettes with hand-authored clean fracture overlays; fourth state adds an amber fault for the bomb-only stone.")

    emit("target-outline", outline(), [[216, 555, 269, 606]], "Transparent center and feathered outer glow.", "Independent rounded target ring reconstructed from the concept's gold outline, since the original glow overlaps soil pixels.", 15)
    emit("work-line", work_line(), [[64, 607, 475, 622]], "Transparent feathered line.", "Rebuilt as a narrow stretchable glow using source amber/yellow colors; removes soil and frame contamination.")

    emit("frame-top", source.crop((78, 221, 449, 239)).resize((128, 18), RESAMPLE), [[78, 221, 449, 239]], "Opaque metal strip; nine-slice vertical edges retain the source bevel.", border=8)
    for side, box in [("left", (36, 311, 52, 409)), ("right", (484, 311, 500, 409))]:
        emit("frame-" + side, source.crop(box).resize((16, 128), RESAMPLE), [list(box)], "Opaque narrow upright segment, no gem content.", border=4)
    for side, box, points in [
        ("left", (30, 218, 80, 248), [(8, 1), (44, 1), (49, 11), (46, 28), (4, 28), (0, 21), (2, 9)]),
        ("right", (448, 218, 498, 248), [(7, 1), (44, 2), (49, 11), (48, 27), (4, 29), (0, 21), (0, 9)]),
    ]:
        emit("frame-corner-" + side, copper_corner(source, box, points, side), [list(box)], "Supersampled hand-traced outer polygon; source lighting retained, neighboring blue gem contamination excluded outside the bolt.")
    for side, box in [("left", (28, 287, 56, 309)), ("right", (483, 287, 511, 309))]:
        emit("frame-anchor-" + side, polygon_cutout(source, box, [(1, 4), (25, 4), (27, 7), (27, 17), (24, 20), (2, 20), (0, 17), (0, 7)]), [list(box)], "Supersampled hand-traced bracket silhouette.")

    emit("hud-panel", hud_panel(), [[94, 58, 434, 96]], "Transparent beveled outer silhouette.", "Empty nine-slice panel reconstructed from source frame colors. Source text and icons obscured the fill, so the center cannot be recovered exactly.", 8)
    icons = {"depth": ((106, 62, 131, 91), (24, 28), "gold", True),
             "time": ((221, 62, 251, 91), (28, 28), "gold", False),
             "ore": ((350, 63, 386, 91), (36, 28), "gem", True)}
    for name, (box, size, kind, holes) in icons.items():
        emit("hud-" + name, centered(color_cutout(source, box, kind, holes), size, 1), [list(box)], "Color silhouette isolated from HUD; clock counter-space remains transparent.")
    copper = color_cutout(source, (350, 63, 386, 91), "gem")
    emit("ore-copper", centered(copper.resize((47, 38), RESAMPLE), (56, 56), 0), [[350, 63, 386, 91]], "Color-separated ore icon reused as a tile overlay.", "Uses the clean HUD ore icon because the larger ground ore has soil-colored occluded edges.")
    emit("ore-cyan", centered(color_cutout(source, (326, 724, 375, 778), "cyan"), (56, 56)), [[326, 724, 375, 778]], "Cyan color silhouette isolated from soil.")

    for side, box in [("left", (0, 700, 56, 956)), ("right", (480, 700, 512, 956))]:
        emit("wall-" + side, wall_strip(source, box, side), [list(box)], "Rock silhouette isolated from the quiet shaft plane.", "A clean wall segment is normalized to 256px and followed by its vertical reflection. Both vertical tile boundaries are pixel-identical; the wall is a repeatable component rather than an entire scene.", packable=False)

    lamp_box = (3, 27, 69, 111)
    lamp = source.crop(lamp_box).convert("RGBA")
    lamp_mask = Image.new("L", lamp.size)
    lamp_draw = ImageDraw.Draw(lamp_mask)
    lamp_draw.polygon([(1, 28), (55, 2), (63, 3), (64, 16), (9, 42), (1, 39)], fill=255)
    lamp_draw.polygon([(5, 41), (11, 39), (34, 20), (30, 33), (11, 62), (5, 61)], fill=255)
    lamp_draw.polygon([(35, 24), (45, 27), (43, 34), (47, 39), (48, 48), (52, 55), (50, 76), (43, 81), (30, 78), (27, 69), (27, 51), (30, 42), (35, 38)], fill=255)
    lamp.putalpha(lamp_mask.filter(ImageFilter.GaussianBlur(0.25)))
    emit("lamp", centered(lamp, (72, 96), 0), [list(lamp_box)], "Hand-traced wood support and lamp polygons; light baked in the lamp glass only.")
    glow = Image.new("RGBA", (128, 128))
    pixels = glow.load()
    for y in range(128):
        for x in range(128):
            distance = (((x - 63.5) / 63.5) ** 2 + ((y - 63.5) / 63.5) ** 2) ** 0.5
            pixels[x, y] = (255, 162, 42, round(max(0, 1 - distance) ** 2 * 105))
    emit("lamp-glow", glow, [list(lamp_box)], "Fully transparent radial edge.", "Separate soft amber radial glow reconstructed from source lighting for independent opacity animation.")
    emit("crystal", centered(color_cutout(source, (5, 460, 36, 505), "cyan"), (48, 64), 1), [[5, 460, 36, 505]], "Cyan silhouette isolated from the side-wall rock.")
    emit("shaft-backdrop", shaft_backdrop(source), [[100, 105, 450, 212]], "Opaque quiet gradient background plane.", "Reserved-space pixels resized into a small low-frequency backdrop, independent of scrolling walls and props.", packable=False)

    manifest = {
        "version": 1, "generator": "tools/extract_deep_mining.py",
        "source": {"path": SOURCE.relative_to(ROOT).as_posix(), "sha256": sha256(SOURCE), "dimensions": list(source.size), "selectedScreen": [0, 0, 512, 1024]},
        "referenceGeometry": {"columns": 8, "cellPitch": 53.5, "gridLeft": 58, "gridTop": 239, "workLineY": 614, "screenScaleTo720": 720 / 512},
        "limitations": ["Flattened concept PNG has no true source layers; extraction and reconstructed pixels are explicitly identified per asset.", "Four stone durability states and empty HUD fill are reconstructed for native scene authoring.", "No text is baked into extracted HUD resources; use native Label components.", "Future soil fade and target highlight are independent scene layers, not per-depth duplicated textures."],
        "assets": records,
        "statistics": {"pngCount": len(records), "pngBytes": sum(record["bytes"] for record in records.values()), "pixelArea": sum(record["dimensions"][0] * record["dimensions"][1] for record in records.values())},
    }
    write_json(MANIFEST, manifest)
    if preview:
        make_preview(images, preview)
    print(json.dumps({"manifest": str(MANIFEST), **manifest["statistics"], "preview": str(preview) if preview else None}, ensure_ascii=False))


def make_preview(images: dict[str, Image.Image], path: Path) -> None:
    columns, cell_width, cell_height = 6, 190, 175
    sheet = Image.new("RGB", (columns * cell_width, ((len(images) + columns - 1) // columns) * cell_height), (48, 51, 61))
    draw = ImageDraw.Draw(sheet)
    for index, (name, image) in enumerate(images.items()):
        left, top = (index % columns) * cell_width, (index // columns) * cell_height
        draw.rectangle((left + 8, top + 20, left + cell_width - 8, top + 154), fill=(205, 205, 205))
        thumb = image.copy()
        thumb.thumbnail((150, 128), RESAMPLE)
        sheet.paste(thumb, (left + (cell_width - thumb.width) // 2, top + 24 + (128 - thumb.height) // 2), thumb)
        draw.text((left + 10, top + 4), name, fill="white")
        draw.text((left + 10, top + 158), f"{image.width} x {image.height}", fill=(210, 210, 210))
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview", type=Path, help="Optional contact-sheet output outside the imported asset directory.")
    parser.add_argument("--only", nargs="+", help="Regenerate selected asset stems while retaining the other manifest entries and files.")
    arguments = parser.parse_args()
    export(arguments.preview, set(arguments.only) if arguments.only else None)
