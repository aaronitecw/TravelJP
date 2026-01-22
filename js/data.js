export const CATEGORIES = [
    { id: 'dining', name: 'Dining', icon: 'utensils', color: 'var(--accent-cyan)' },
    { id: 'directions', name: 'Directions', icon: 'map-pin', color: 'var(--accent-purple)' },
    { id: 'hotel', name: 'Hotel', icon: 'bed-double', color: '#ffbd00' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#ff0055' },
    { id: 'emergencies', name: 'Emergencies', icon: 'alert-triangle', color: '#ff3333' },
];

export const PHRASES = {
    dining: [
        { id: 'd1', en: 'Water, please.', ja: 'お水をください', romaji: 'Omizu o kudasai' },
        { id: 'd2', en: 'Menu, please.', ja: 'メニューをください', romaji: 'Menyuu o kudasai' },
        { id: 'd3', en: 'Check, please.', ja: 'お会計をお願いします', romaji: 'Okaikei o onegaishimasu' },
        { id: 'd4', en: 'Delicious!', ja: '美味しいです', romaji: 'Oishii desu' },
        { id: 'd5', en: 'Do you have an English menu?', ja: '英語のメニューはありますか？', romaji: 'Eigo no menyuu wa arimasuka?' },
    ],
    directions: [
        { id: 'dir1', en: 'Where is the station?', ja: '駅はどこですか？', romaji: 'Eki wa doko desu ka?' },
        { id: 'dir2', en: 'Is this the right train for Shinjuku?', ja: 'これは新宿行きの電車ですか？', romaji: 'Kore wa Shinjuku-iki no densha desu ka?' },
        { id: 'dir3', en: 'Where is the toilet?', ja: 'トイレはどこですか？', romaji: 'Toire wa doko desu ka?' },
        { id: 'dir4', en: 'Turn right.', ja: '右に曲がってください', romaji: 'Migi ni magatte kudasai' },
    ],
    hotel: [
        { id: 'h1', en: 'Check-in, please.', ja: 'チェックインをお願いします', romaji: 'Chekku-in o onegaishimasu' },
        { id: 'h2', en: 'Wi-Fi password?', ja: 'Wi-Fiのパスワードは？', romaji: 'Wi-Fi no pasuwado wa?' },
        { id: 'h3', en: 'My key, please.', ja: '鍵をください', romaji: 'Kagi o kudasai' },
    ],
    shopping: [
        { id: 's1', en: 'How much is this?', ja: 'これはいくらですか？', romaji: 'Kore wa ikura desu ka?' },
        { id: 's2', en: 'Do you have this?', ja: 'これはありますか？', romaji: 'Kore wa arimasu ka?' },
        { id: 's3', en: 'I will take it.', ja: 'これにします', romaji: 'Kore ni shimasu' },
    ],
    emergencies: [
        { id: 'e1', en: 'Help!', ja: '助けて！', romaji: 'Tasukete!' },
        { id: 'e2', en: 'Police!', ja: '警察！', romaji: 'Keisatsu!' },
        { id: 'e3', en: 'I do not understand.', ja: 'わかりません', romaji: 'Wakarimasen' },
        { id: 'e4', en: 'Where is the hospital?', ja: '病院はどこですか？', romaji: 'Byouin wa doko desu ka?' },
    ]
};
