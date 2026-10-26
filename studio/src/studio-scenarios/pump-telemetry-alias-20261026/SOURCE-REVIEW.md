# Source and model review — KAIRO pump telemetry aliasing (26 October 2026)

## Learner problem
A sensor's digital trace can seem slower than the underlying fictional oscillation. A learner should be able to distinguish the true prepared sine frequency from the *apparent* frequency in uniformly spaced samples and test the strict ideal Nyquist condition. This is a separate challenge from hydraulic power, pump arrangement and gauge uncertainty.

## Sources and boundary
- [MIT OpenCourseWare, Lecture 16: Sampling](https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/resources/lecture-16-sampling/): sampling/aliasing of a sinusoid and why undersampling folds higher frequencies into lower ones.
- [NI, Nyquist Theorem](https://www.ni.com/docs/en-US/bundle/ni-dmm/page/nyquist-theorem_1.html): the sampling-frequency criterion and false lower-frequency aliases.

These are **public concept references**, not reviewed KAIRO curriculum excerpts, sensor measurements, endorsed equipment advice or a licence to reproduce their illustrations. All graph and teaching text is original; no third-party assets are embedded. **Independent subject review pending** for the exact pedagogy, wording and engineering context.

## Explicit synthetic assumptions
- Two invented pressure-ripple signals, each a single noiseless unitless sine at 6 or 9 Hz, with phase π/6.
- Sample rates 8, 10, 16 or 24 Hz, uniform sampling, no filtering or jitter, one second of samples.
- The displayed apparent frequency is |f - round(f/fs) fs|, valid for this *single prepared sine*.
- Strict ideal Nyquist check is fs > 2f. This is not a claim that samples alone identify an arbitrary real signal; real signals can contain unknown frequencies, noise, harmonics and filters.
- These fictional values are **not** safe real-pump operating guidance, measurements, faults or diagnoses. No Kaggle or other model training occurs.

## Evidence and accessibility
A learner chooses a rate, predicts the apparent frequency and ideal sampling condition, writes an explanation *before* reveal, then sees an SVG trace and equivalent full numeric table. A second independent fictional round follows. A versioned action-only local JSON record rejects stale versions, fabricated results, owner IDs and evidence promotion; it never becomes authenticated progress.

Native form controls, reading table, visible focus, polite status and reduced-motion styles are implemented. Automated source inspection and mathematical tests do not establish real browser, keyboard, screen-reader, zoom, mobile or learner acceptance. Those need authorized device QA and independent review. The standalone Vite preview is not mounted in StudioRouter and is not deployed.
