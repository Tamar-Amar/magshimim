from PIL import Image

SRC = "/Users/tmrmr/פרויקטים/magshimim/public/logos_raw-1.png"
OUT = "/Users/tmrmr/פרויקטים/magshimim/public/logos.webp"

im = Image.open(SRC).convert("RGBA")
px = im.load()
w, h = im.size

LOW, HIGH = 210, 245  # whiteness thresholds for soft alpha
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        whiteness = min(r, g, b)
        if whiteness >= HIGH:
            alpha = 0
        elif whiteness <= LOW:
            alpha = 255
        else:
            alpha = int(255 * (HIGH - whiteness) / (HIGH - LOW))
        px[x, y] = (r, g, b, alpha)

bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

# resize to a reasonable width (retina-friendly)
target_w = 1000
if im.width > target_w:
    ratio = target_w / im.width
    im = im.resize((target_w, int(im.height * ratio)), Image.LANCZOS)

im.save(OUT, "WEBP", quality=90, method=6)
print("saved", OUT, "size", im.size)
