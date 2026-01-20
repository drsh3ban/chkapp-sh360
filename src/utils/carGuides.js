/**
 * SVG skeletons for vehicle inspection guides.
 * These are used as overlays or previews to help users align the camera.
 */
export const CarGuides = {
    front: `
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 70 L40 50 Q40 30 70 25 L130 25 Q160 30 160 50 L160 70 Z" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <rect x="50" y="70" width="100" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
            <circle cx="65" cy="80" r="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <circle cx="135" cy="80" r="8" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <rect x="85" y="85" width="30" height="10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
    `,
    back: `
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="40" width="120" height="50" rx="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <rect x="60" y="30" width="80" height="30" rx="5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <rect x="50" y="50" width="20" height="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <rect x="130" y="50" width="20" height="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <rect x="85" y="75" width="30" height="10" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
        </svg>
    `,
    side: `
        <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 70 L30 50 Q40 30 70 25 L140 25 Q170 30 180 50 L190 70 Z" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <circle cx="50" cy="75" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <circle cx="150" cy="75" r="12" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <path d="M60 40 L140 40" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
    `,
    interior: `
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="60" r="30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"/>
            <rect x="70" y="55" width="60" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <path d="M100 30 L100 90 M70 60 L130 60" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
    `
};

export const getGuideForSlot = (slotId) => {
    if (slotId.includes('front')) return CarGuides.front;
    if (slotId.includes('back')) return CarGuides.back;
    if (slotId.includes('right') || slotId.includes('left')) return CarGuides.side;
    if (slotId.includes('interior')) return CarGuides.interior;
    return CarGuides.front;
};
