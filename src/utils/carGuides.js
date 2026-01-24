/**
 * Simple Outer-Edge Car Silhouettes (v1.7.0)
 * ONLY the outer shape of the car. NO internal details.
 * Glowing white outline for alignment.
 */
export const CarGuides = {
    front: `
        <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <!-- Single outer contour only -->
            <path d="M55 35 Q100 25 145 35 L155 55 L165 75 L165 115 Q165 125 150 130 L50 130 Q35 125 35 115 L35 75 L45 55 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    back: `
        <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <path d="M55 35 Q100 25 145 35 L160 60 L170 85 L170 115 Q170 130 145 135 L55 135 Q30 130 30 115 L30 85 L40 60 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    side: `
        <svg viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <!-- Only the outer shell -->
            <path d="M15 75 L25 75 L40 45 L85 35 L190 35 L220 55 L225 75 L235 80 L235 90 L15 90 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Wheel cutouts (simple arcs) -->
            <path d="M45 90 Q60 70 75 90" fill="none" stroke="currentColor" stroke-width="2"/>
            <path d="M175 90 Q190 70 205 90" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
    `,
    interior: `
        <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <!-- Simple steering wheel circle -->
            <circle cx="100" cy="80" r="45" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
    `,
    dash: `
        <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <!-- Simple dashboard shape -->
            <path d="M20 80 Q20 25 100 20 Q180 25 180 80 L180 95 L20 95 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `
};

export const getGuideForSlot = (slotId) => {
    if (!slotId) return CarGuides.front;
    const id = slotId.toLowerCase();

    if (id.includes('front')) return CarGuides.front;
    if (id.includes('back') || id.includes('rear')) return CarGuides.back;
    if (id.includes('right') || id.includes('left') || id.includes('side')) return CarGuides.side;
    if (id.includes('dash') || id.includes('mileage') || id.includes('speedo')) return CarGuides.dash;
    if (id.includes('interior')) return CarGuides.interior;

    return CarGuides.front;
};
