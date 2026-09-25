// ============================================================
//  Upload PNGs (pls ONLY do transparent backgrounds) into the 'characters' folder
//  If an image is missing, a placeholder silhouette is drawn. (:fire:)
// ============================================================

export const GUARD = {
    name: 'Hong Lu',
    image: 'characters/baoyu.png',
    color: '#3f7a4a'
};

export const QUEEN = {
    name: 'Queen of Hatred',
    image: 'characters/queenie.png',
    color: '#ff5fa8'
};

// types:
//    - 'mask'  -> reaches the office, put the mask on fast
//    - 'light' -> waits in the hall, flash the flashlight at it
//    - 'box'   -> keep it wound up on CAM 6
export const ABNORMALITIES = [
    {
        id: 'scorched',
        name: 'Scorched Girl',
        image: 'characters/scorchedgirl.png',
        color: '#ff5a1f',
        type: 'mask',
        path: ['STAGE', 'CAM1', 'VENT_L', 'OFFICE']
    },
    {
        id: 'fragment',
        name: 'Fragment of the Universe',
        image: 'characters/FoU.png',
        color: '#b06bff',
        type: 'mask',
        path: ['STAGE', 'PARTS', 'VENT_R', 'OFFICE']
    },
    {
        id: 'wolf',
        name: 'Big and Will Be Bad Wolf',
        image: 'characters/BaWBW.png',
        color: '#9aa0b5',
        type: 'light',
        path: ['PARTS', 'CAM1', 'HALL_FAR', 'HALL_NEAR']
    },
    {
        id: 'calendar',
        name: 'Doomsday Calendar',
        image: 'characters/doomsday-calendar.png',
        color: '#d9a441',
        type: 'box',
        path: ['PRIZE']
    }
];

export const QUEEN_TEXTS = [
    'Hong Lu~ Are you staying safe out there?',
    'Just checking in!! You doing good?',
    'Hi Honey! Hows the job treating you?',
    'Hellooo? Your magical girl is worried!',
    'Don\'t fall asleep on shift, okay honey?',
];

export const QUEEN_HAPPY = ['Yay! Stay strong!', 'Good boy~ keep it up!', 'Teehee~ I love you so much!', 'Hehe, that\'s the spirit! ✨'];
export const QUEEN_ANGRY = ['...why aren\'t you answering me?', 'You\'re IGNORING me??', 'D..did I do something to upset you...?', 'Y..You there?..',];

export const HOUR_SECONDS = 50;
