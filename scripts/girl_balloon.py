from PIL import Image
from collections import deque

SRC = "/Users/tmrmr/.cursor/projects/Users-tmrmr-magshimim/assets/WhatsApp_Image_2026-06-25_at_11.35.29-2eae5057-1702-4e91-8271-eed4958d37bb.png"
OUT = "/Users/tmrmr/פרויקטים/magshimim/public/balloon.webp"

im = Image.open(SRC).convert("RGBA")
px = im.load()
w, h = im.size

def is_white(r, g, b, thr=238):
    return r >= thr and g >= thr and b >= thr

def is_strict_white(r, g, b):
    # True near-white/gray background, not a colored pastel highlight.
    return min(r, g, b) >= 243 and (max(r, g, b) - min(r, g, b)) <= 12

# Flood fill from the borders so only the connected outer white background
# is removed, leaving light pastel areas inside the artwork intact.
visited = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    for y in (0, h - 1):
        q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        q.append((x, y))

while q:
    x, y = q.popleft()
    if x < 0 or x >= w or y < 0 or y >= h or visited[y][x]:
        continue
    visited[y][x] = True
    r, g, b, a = px[x, y]
    if not is_white(r, g, b):
        continue
    px[x, y] = (r, g, b, 0)
    q.append((x + 1, y))
    q.append((x - 1, y))
    q.append((x, y + 1))
    q.append((x, y - 1))

# Remove enclosed white pockets (e.g. the page showing between the ropes)
# that the border flood-fill could not reach. Only strict white/gray is
# cleared so colored pastel areas of the artwork stay intact.
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        if is_strict_white(r, g, b):
            px[x, y] = (r, g, b, 0)

# Soften the edge: make near-white border pixels adjacent to transparency
# semi-transparent to avoid a hard white halo.
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        if is_white(r, g, b, thr=246):
            neighbor_clear = any(
                0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] == 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            if neighbor_clear:
                px[x, y] = (r, g, b, 120)

bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

im.save(OUT, "WEBP", quality=92, method=6)
print("saved", OUT, "size", im.size)
