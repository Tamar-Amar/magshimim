from PIL import Image

SRC = "/Users/tmrmr/.cursor/projects/Users-tmrmr-magshimim/assets/balloon_green.png"
OUT = "/Users/tmrmr/פרויקטים/magshimim/public/balloon.png"

im = Image.open(SRC).convert("RGBA")
px = im.load()
w, h = im.size

LOW, HIGH = 45, 95  # greenness thresholds for soft alpha

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        greenness = g - max(r, b)
        if greenness >= HIGH:
            alpha = 0
        elif greenness <= LOW:
            alpha = 255
        else:
            alpha = int(255 * (HIGH - greenness) / (HIGH - LOW))
        # green spill suppression on semi-transparent edges
        if 0 < alpha < 255 and g > max(r, b):
            g = max(r, b)
        px[x, y] = (r, g, b, alpha)

# crop to the visible subject (trim transparent margins)
bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

im.save(OUT)
print("saved", OUT, "size", im.size)
