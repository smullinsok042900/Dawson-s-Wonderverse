// Keep procedural construction in short tasks so input and animation can run between slices.
export function runInSlices(iterator, { budget = 3.5, now = () => performance.now(), schedule = fn => setTimeout(fn, 8), signal } = {}) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (error, value) => {
      if (finished) return;
      finished = true; signal?.removeEventListener('abort', abort);
      if (error) { try { iterator.return?.(); } catch { /* report the original construction failure */ } reject(error); }
      else resolve(value);
    };
    const abort = () => finish(new DOMException('Destination preparation cancelled', 'AbortError'));
    const step = () => {
      if (finished) return;
      const start = now();
      try {
        do {
          const result = iterator.next();
          if (result.done) { finish(null, result.value); return; }
        } while (now() - start < budget);
        schedule(step);
      } catch (error) { finish(error); }
    };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    schedule(step);
  });
}
