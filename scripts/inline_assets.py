import base64
import pathlib

PUB = pathlib.Path("/Users/tmrmr/פרויקטים/magshimim/public")


def b64(name):
    data = (PUB / name).read_bytes()
    return base64.b64encode(data).decode("ascii")


sky = b64("sky.webp")
balloon = b64("balloon.webp")

css = (
    ":root {\n"
    f"  --sky-img: url('data:image/webp;base64,{sky}');\n"
    f"  --balloon-img: url('data:image/webp;base64,{balloon}');\n"
    "}\n"
)

out = PUB / "inline-assets.css"
out.write_text(css, encoding="utf-8")
print("wrote", out, out.stat().st_size, "bytes")
