# Pet Nursery & Creative Studio

User-approved direction: original pet care and creative play inspired by Fluvsies and Crayola Create and Play. Three hatchable pets, gentle repeatable care, and creations that pets actually use. Deliver as one PR, user merges.

Approach: add an offline illustrated playroom, accessible from a large egg button and the existing Fluffkin house. The existing 3D world pauses while it is open. This keeps exploration rendering unchanged and permits direct touch play. Expanding every pet into a new animated 3D agent would add ongoing rendering cost; replacing the whole world would discard existing play. The dedicated playroom builds on the existing modal architecture.

Three original creatures: Pip (peach, berry-loving, bouncy ears), Moss (mint, carrot-loving, leaf ears), and Twinkle (lavender, apple-loving, star antennae). First egg is available immediately. Feeding, bathing, brushing and playing with one pet reveal the next egg. Bedtime is optional and pets can be awakened immediately. No clocks, decline, penalties, currency or waiting. Each hatch is a three-tap playful reveal, preserved across reloads.

Care is direct manipulation: select a food then feed the pet; rub bubbles or a brush over it (tapping also works); toss a ball; tuck it into its own blanket. Visual responses and spoken instructions explain everything. Repeat care remains available after unlocking all eggs. Each pet remembers its own care, designs, bedding, room color and sleep state.

Studio: choose a blanket or outfit, choose one of six colors, place stars/hearts/flowers or draw freehand on a bounded SVG canvas, undo or clear, then apply. The pet wears the outfit and sleeps beneath the blanket. Save compact vector marks in the existing save object, with bounded validated data. No images or scripts accepted from saves. Per-pet room colors and artwork display personalize the room.

No new dependencies, WebGL objects, shaders or per-frame world updates. Honor calm/reduced-motion and existing sound settings. Large 48px targets, picture navigation, voice repeat, keyboard close/focus handling, touch and mouse drawing, portrait/landscape scrolling. Preserve all existing save fields and features.

Verification: state tests for progression, independence, reload/malformed data and bounded art; browser tests for actual hatch/care/drawing/apply/sleep/reopen, modal guards, touch sizes and legacy saves; fixed-view before/after performance and full existing smoke suite on desktop software rendering. Real iPhone remains a follow-up.
