# Seamless castle-brick texture set (colour, normal, roughness): 8 rows x 4 bricks per tile
# (the same layout as the old canvas bricks, so the castle's texture scale is unchanged).
# Each brick: its own rose/blush tone, worn rounded edges, a little bulge, chips and grain;
# recessed mortar with ambient occlusion.   python3 tools/textures/make_bricks.py <out_dir>
import sys, os, numpy as np
from PIL import Image
out = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(out, exist_ok=True)
R = 1024; rows, cols = 8, 4; rng = np.random.default_rng(11)
y, x = np.mgrid[0:R, 0:R] / R
def fnoise(cut, seed):            # seamless band-limited noise (FFT-filtered white noise wraps perfectly)
    w = np.random.default_rng(seed).standard_normal((R, R)); f = np.fft.fftfreq(R) * R
    k = np.sqrt(f[None, :] ** 2 + f[:, None] ** 2); F = np.fft.fft2(w) * np.exp(-(k / cut) ** 2)
    n = np.real(np.fft.ifft2(F)); return n / n.std()
def pnoise(freqs, amp):
    v = np.zeros_like(x)
    for f, a in zip(freqs, amp):
        for _ in range(3):
            fx, fy, ph = rng.integers(-f, f + 1), rng.integers(-f, f + 1), rng.random() * 6.283
            if fx == 0 and fy == 0: fx = f
            v += a * np.sin(6.283 * (fx * x + fy * y) + ph)
    return v
r = np.floor(y * rows).astype(int); off = (r % 2) * .5
u = x * cols + off; c = np.floor(u).astype(int) % cols; fu = u - np.floor(u); fv = y * rows - r
bid = r * cols + c
# distance to the brick edge (in brick-height units), with a slightly wobbly outline
wob = pnoise([9, 19], [.012, .006])
ex = np.minimum(fu, 1 - fu) * (rows / cols) * 2; ey = np.minimum(fv, 1 - fv)
e = np.minimum(ex, ey) + wob
mort = .085
shape = np.clip((e - mort) / .16, 0, 1); shape = shape * shape * (3 - 2 * shape)
grain = (fnoise(40, 1) * .6 + fnoise(160, 2) * .4) * .35
bul = rng.uniform(.85, 1.1, rows * cols)
H = shape * (bul[bid] - .12 * ((fu - .5) ** 2 * 2 + (fv - .5) ** 2)) + grain * .04 * shape
# chips: a few small dents near brick edges
for _ in range(90):
    cx, cy, rr = rng.random(), rng.random(), rng.uniform(.006, .016)
    dx = x - cx; dx -= np.round(dx); dy = y - cy; dy -= np.round(dy); d = np.sqrt(dx * dx + dy * dy)
    H -= np.clip(1 - d / rr, 0, 1) ** 2 * .35 * (e < .3)
H = np.clip(H, 0, None)
tones = np.array([[226, 170, 190], [234, 184, 200], [218, 162, 184], [240, 194, 206], [228, 176, 182], [222, 172, 200]], float) / 255
bc = tones[rng.integers(0, len(tones), rows * cols)] * rng.uniform(.93, 1.05, (rows * cols, 1))
C = bc[bid] * (1 + grain[..., None] * .07)
mortar = np.array([236, 220, 214]) / 255 * (1 + grain[..., None] * .1)
mk = np.clip(1 - (e - .02) / mort, 0, 1)[..., None]
C = C * (1 - mk) + mortar * mk
ao = .62 + .38 * np.clip(shape * 1.4, 0, 1) ** .6; C *= ao[..., None]
s = 4.0 * R / 256
hx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * .5 * s; hy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * .5 * s
nz = 1 / np.sqrt(hx * hx + hy * hy + 1)
N = np.stack([-hx * nz * .5 + .5, hy * nz * .5 + .5, nz * .5 + .5], -1)
rough = .7 + .2 * mk[..., 0]
sv = lambda a, n, q=90: Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype('uint8')).save(os.path.join(out, n), quality=q)
sv(C, 'brick_col.jpg'); sv(N, 'brick_nrm.jpg', 92); sv(rough, 'brick_rough.jpg', 85)
print('bricks ok')
