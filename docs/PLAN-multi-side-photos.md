# PLAN: Multi-Side Photos

## Overview
Add support for capturing two photos for each side of the vehicle (Right/Left) plus Front, Back, and Interior. Total 7 photos.

## Proposed Changes
1. **PhotoCapture Component**: Transition to a slot-based system.
2. **Registration Pages**: Define 7 specific slots for car angles.
3. **PDF Generator**: Update layout to show 2 photos per line.

## Implementation Details
- `PhotoCapture` will show specific labels for each slot.
- `pdfGenerator` will wrap every 2 images.

## Verification
- Manual test of exit/entry flows.
- PDF visual check.
