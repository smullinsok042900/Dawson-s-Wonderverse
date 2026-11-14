# Combined release review

Independent review identified: functional animations hidden by calm settings; impossible replay of already-rescued babies; home-gallery visit routing; woodland prerequisite lost on stream reload; inherited adventure IDs accepted by malformed saves; incomplete instrument music routing; train reward static rather than active; guide restoration and modal keyboard propagation; far home traversal.

All identified issues were addressed. Regression tests exercise actual browser behavior for calm bubbles/float/magnet outcomes, guide reload, picture-story rescue replay, home visit routing, woodland prerequisite restore, band audio channels, moving train and detached distant home group. Unit test covers inherited keys and reward idempotency. Actual iPhone results remain unverified.

Rescue replay is explicitly spoken as retelling through three pictures when every baby is already home; it never resets rescued babies or awards duplicate prizes.
