import { Stream } from '../types';

export const MOCK_STREAMS: Stream[] = [
    {
        id: 'stream-morning-routine',
        creator_id: 'system',
        title: 'Miracle Morning Routine',
        description: 'Start your day with purpose using the S.A.V.E.R.S. method: Silence, Affirmations, Visualization, Exercise, Reading, and Scribing.',
        category: 'Productivity',
        tags: ['morning', 'wellness', 'habits'],
        is_public: true,
        likes_count: 1240,
        created_at: new Date().toISOString(),
        items: [
            {
                id: 'item-1',
                stream_id: 'stream-morning-routine',
                title: 'Silence / Meditation',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '06:00'
            },
            {
                id: 'item-2',
                stream_id: 'stream-morning-routine',
                title: 'Exercise',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '06:15'
            },
            {
                id: 'item-3',
                stream_id: 'stream-morning-routine',
                title: 'Reading',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '06:45'
            }
        ]
    },
    {
        id: 'stream-75-hard',
        creator_id: 'system',
        title: '75 Hard Challenge',
        description: 'The ultimate mental toughness challenge. 75 days of strict rules to transform your life.',
        category: 'Health & Fitness',
        tags: ['challenge', 'fitness', 'discipline'],
        is_public: true,
        likes_count: 890,
        created_at: new Date().toISOString(),
        items: [
            {
                id: 'item-75-1',
                stream_id: 'stream-75-hard',
                title: 'Take progress photo',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '07:00'
            },
            {
                id: 'item-75-2',
                stream_id: 'stream-75-hard',
                title: 'Read 10 pages',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '20:00'
            },
            {
                id: 'item-75-3',
                stream_id: 'stream-75-hard',
                title: 'Drink 1 gallon of water',
                recurrence_rule: { type: 'daily', interval: 1 },
                day_offset: 0,
                time_of_day: '21:00'
            }
        ]
    },
    {
        id: 'stream-sunday-reset',
        creator_id: 'system',
        title: 'Sunday Reset',
        description: 'Get ready for the week ahead with this comprehensive Sunday cleaning and planning routine.',
        category: 'Home',
        tags: ['cleaning', 'planning', 'weekly'],
        is_public: true,
        likes_count: 560,
        created_at: new Date().toISOString(),
        items: [
            {
                id: 'item-sun-1',
                stream_id: 'stream-sunday-reset',
                title: 'Review calendar for next week',
                recurrence_rule: { type: 'weekly', interval: 1, weekdays: [7] }, // Sunday
                day_offset: 0,
                time_of_day: '10:00'
            },
            {
                id: 'item-sun-2',
                stream_id: 'stream-sunday-reset',
                title: 'Meal prep',
                recurrence_rule: { type: 'weekly', interval: 1, weekdays: [7] },
                day_offset: 0,
                time_of_day: '14:00'
            }
        ]
    }
];
