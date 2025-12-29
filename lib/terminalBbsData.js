/**
 * Consolidated BBS catalog (seed data).
 *
 * Shape: { groups: { [groupId]: BbsPost[] } }
 *
 * Notes:
 * - This is intentionally data-driven so we can add more groups/posts later.
 * - Read/unread state is persisted separately (see terminalBbs.js).
 */

export const terminalBbsData = {
  groups: {
    'neon.missions': [
      {
        id: 'neon_missions_fantasy_score_quietly_v1',
        title: "Change last week’s score quietly",
        date: '2024-02-08T23:10:00Z',
        body: [
          'parker@neon-city wrote:',
          '',
          'Not sure who else to ask.',
          '',
          'I need you to change a fantasy football score from last week.',
          'My team shows 66. I need it to say 69 so I beat someone who has 67.',
          '',
          'Constraints:',
          '- Do not change anything else.',
          '- Any extra change will make it obvious something happened.',
          '- The edit has to be subtle and minimal.',
          '',
          'Host: fantasy-football-league.com',
          'User: parker',
          'Pass: sundaypaper',
          '',
          'Those creds are just a regular user. I can’t edit the file directly.',
          '',
          '---',
          '',
          'bitflip@neon-city replied:',
          '',
          'All you need to do is get memcorrupt and run it against the web server.',
          'Don’t touch files. Don’t edit anything else. Just corrupt the service memory.',
          '',
          '---',
          '',
          'parker@neon-city replied:',
          '',
          "I don't know what any of that means.",
          "I can ssh in. I can run ls/cat. That's it.",
          'What is “the web server”? How do you “run it against” something?',
          '',
          '-p',
        ].join('\n'),
      },
      {
        id: 'neon_missions_shadow_party_mindwarp_leak_v1',
        title: 'Shadow Party: mindwarp creds leak',
        date: '2024-02-11T21:15:00Z',
        body: [
          'thread dump:',
          '',
          'Someone dropped a “shadow snapshot” from an old Mindwarp box.',
          'Looks like a toy export, but it might be enough to recover a weak password.',
          '',
          'hostname: mindwarp.com',
          'username: jsj',
          'no known password',
          '',
          'If you’re doing this the boring way:',
          '- download and decrypt the leak.',
          '- install the hash-index tool',
          '- run it with jsj’s salt + hash:',
          '    hash-index <salt> <hash>',
          '',
          'Rumor: the hash-index binary will brute a weak password, but it needs a clean route.',
          '',
          '-bitflip',
        ].join('\n'),
      },
    ],
  },
};


