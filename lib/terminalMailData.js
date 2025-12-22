/**
 * Consolidated mail catalog (seed data), similar in spirit to terminalFilesystem's data tables.
 *
 * Shape: { [host]: { [user]: MailMessage[] } }
 *
 * Notes:
 * - `hidden` is optional; if omitted, callers treat it as hidden by default.
 * - `unlockKey` is optional; missions can unhide by key later.
 */

export const terminalMailData = {
  arcade: {
    rg: [
      {
        id: 'seed_rg_arcade_moodful_ssh_creds_v1',
        from: 'ops@moodful.ca',
        subject: 'Reminder: SSH creds for moodful.ca (root)',
        // Keep it deterministic for tests and stable ordering.
        date: '2024-02-03T05:12:00Z',
        body: [
          'Hey rg,',
          '',
          'Quick reminder for the Moodful box:',
          '',
          '  Host: moodful.ca',
          '  User: root',
          '  Pass: wow',
          '',
          'Command:',
          '  ssh root@moodful.ca',
          '',
          '--',
          'ops@moodful.ca',
        ].join('\n'),
        hidden: false,
      },
      {
        id: 'rg_arcade_ops_moodful_reboot_request_v1',
        from: 'ops@moodful.ca',
        subject: 'OOTO — can you reboot the Moodful server?',
        date: '2024-02-06T16:40:00Z',
        body: [
          'Hey rg,',
          '',
          "We’re out of town and the Moodful box is acting weird again.",
          '',
          'Can you reboot the moodful server for us?',
          '',
          'If you need the creds, check the last email I sent.',
          '',
          '--',
          'ops@moodful.ca',
        ].join('\n'),
        // Hidden until the first successful root ssh to moodful.ca.
        unlockKey: 'moodful_root_first_ssh',
        // hidden omitted -> defaults to hidden
      },
      {
        id: 'rg_arcade_mission_alpha_brief_v1',
        from: 'mission-control@arcade',
        subject: 'Mission Alpha: briefing',
        date: '2024-02-04T09:30:00Z',
        body: [
          'Agent,',
          '',
          'Your next task is available.',
          'When you see this, it means you have completed the prerequisite action.',
          '',
          '- Mission Control',
        ].join('\n'),
        // hidden omitted -> defaults to hidden (revealed via unlockKey)
        unlockKey: 'mission_alpha',
      },
    ],
  },

  'moodful.ca': {
    root: [
      {
        id: 'seed_root_moodful_welcome_v1',
        from: 'postmaster@moodful.ca',
        subject: 'Welcome to moodful.ca',
        date: '2024-02-02T12:00:00Z',
        body: [
          'This is a system-generated message.',
          '',
          'Mailbox initialized for root.',
        ].join('\n'),
        hidden: false,
      },
      {
        id: 'seed_root_moodful_maintenance_v1',
        from: 'ops@moodful.ca',
        subject: 'Maintenance window',
        date: '2024-02-05T18:45:00Z',
        body: [
          'Heads up: planned maintenance window tonight.',
          '',
          'Expected impact: brief restarts.',
        ].join('\n'),
        hidden: false,
      },
      {
        id: 'root_moodful_mission_alpha_secret_v1',
        from: 'mission-control@moodful.ca',
        subject: 'Mission Alpha: access granted',
        date: '2024-02-04T10:00:00Z',
        body: [
          'Access granted.',
          '',
          'Proceed to the next step.',
        ].join('\n'),
        unlockKey: 'mission_alpha',
        // hidden omitted -> defaults to hidden
      },
    ],
  },
};

