# Seamless cobblestone texture set (colour, normal, roughness) for the park path.
# An exact periodic Voronoi (jittered grid with wrap-around), domain-warped by periodic
# noise for organic stone outlines; each stone gets a rounded, slightly tilted top,
# its own colour, surface grain, and occlusion where it meets the mortar.
#   python3 tools/textures/make_cobble.py <out_dir>
import sys, os, numpy as np
from PIL import Image
out = sys.argv[1] if len(sys.argv) > 1 else '.'; os.makedirs(out, exist_ok=True)
R, G = 1024, 8                     # pixels, stones per side (~37 cm stones on the 3 m tile)
rng = np.random.default_rng(7)
y, x = np.mgrid[0:R, 0:R] / R
def fnoise(cut, seed):            # seamless band-limited noise (FFT-filtered white noise wraps perfectly)
    w = np.random.default_rng(seed).standard_normal((R, R)); f = np.fft.fftfreq(R) * R
    k = np.sqrt(f[None, :] ** 2 + f[:, None] ** 2); F = np.fft.fft2(w) * np.exp(-(k / cut) ** 2)
    n = np.real(np.fft.ifft2(F)); return n / n.std()
def pnoise(x, y, freqs, amp):      # smooth periodic noise (integer frequencies wrap perfectly)
    v = np.zeros_like(x)
    for f, a in zip(freqs, amp):
        for _ in range(3):
            fx, fy, ph = rng.integers(-f, f + 1), rng.integers(-f, f + 1), rng.random() * 6.283
            if fx == 0 and fy == 0: fx = f
            v += a * np.sin(6.283 * (fx * x + fy * y) + ph)
    return v
wx = x + pnoise(x, y, [3, 7], [.012, .005]); wy = y + pnoise(x, y, [3, 7], [.012, .005])
pts = (np.stack(np.mgrid[0:G, 0:G], -1).reshape(-1, 2)[:, ::-1] + .5 + rng.uniform(-.32, .32, (G * G, 2))) / G
d1 = np.full((R, R), 9.); d2 = np.full((R, R), 9.); idx = np.zeros((R, R), int)
for k, (px, py) in enumerate(pts):
    dx = wx - px; dx -= np.round(dx); dy = wy - py; dy -= np.round(dy)
    d = np.sqrt(dx * dx + dy * dy * 1.0)
    m = d < d1; d2 = np.where(m, d1, np.minimum(d2, d)); idx = np.where(m, k, idx); d1 = np.where(m, d, d1)
edge = (d2 - d1) / 2 * G                          # distance to the stone edge, in stone units
fine = (fnoise(40, 1) * .6 + fnoise(160, 2) * .4) * .35
mortar_w = .05
shape = np.clip((edge - mortar_w) / .14, 0, 1)
shape = shape * shape * (3 - 2 * shape)            # rounded rim
top = shape * (1 - .35 * np.clip(d1 * G / .62, 0, 1) ** 2)  # flat, gently domed worn top (no ridges)
tilt = rng.uniform(-.25, .25, (G * G, 2)); bump = rng.uniform(.8, 1.1, G * G)
cx, cy = pts[idx, 0], pts[idx, 1]; ddx = x - cx; ddx -= np.round(ddx); ddy = y - cy; ddy -= np.round(ddy)
H = top * bump[idx] * (1 + (tilt[idx, 0] * ddx + tilt[idx, 1] * ddy) * G * .6) + fine * .05 * (shape > 0)
H = np.clip(H, 0, None)
# colour (sRGB): warm pastel stones in a few families, each stone slightly different
fam = np.array([[224, 207, 192], [216, 202, 200], [228, 214, 194], [206, 194, 182], [220, 204, 204], [234, 222, 208]], float) / 255
sc = fam[rng.integers(0, len(fam), G * G)] * rng.uniform(.92, 1.05, (G * G, 1))
C = sc[idx] * (1 + fine[..., None] * .06)
speck = rng.random((R, R)) < .015; C[speck] *= .82
mortar = np.array([168, 150, 134]) / 255 * (1 + fine[..., None] * .2)
mk = np.clip(1 - (edge - .02) / mortar_w, 0, 1)[..., None]
C = C * (1 - mk) + mortar * mk
ao = .68 + .32 * np.clip(shape * 1.6, 0, 1) ** .7; C *= ao[..., None]
# normal map from the periodic height
s = 5.5
hx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * .5 * s; hy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * .5 * s
hx *= R / 256; hy *= R / 256
nz = 1 / np.sqrt(hx * hx + hy * hy + 1)
N = np.stack([-hx * nz * .5 + .5, hy * nz * .5 + .5, nz * .5 + .5], -1)   # (OpenGL convention, +Y up in texture space)
rough = .62 + .3 * mk[..., 0] + .06 * (1 - shape)
sv = lambda a, n, q=90: Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype('uint8')).save(os.path.join(out, n), quality=q)
sv(C, 'cobble_col.jpg'); sv(N, 'cobble_nrm.jpg', 92); sv(rough, 'cobble_rough.jpg', 85)
print('cobble ok')
