# SwimTiers

## Setup

1. Create an application at https://discord.com/developers/applications, name it **SwimTiers**, add a Bot (set its username to SwimTiers too), and copy the token.
2. Invite it with the `bot` and `applications.commands` scopes and these permissions:
   View Channels, Send Messages, Embed Links, Read Message History, Manage Channels, Manage Roles, Mention Everyone.
3. Put the bot's role **above** the waitlist, tier and tester roles in Server Settings → Roles (otherwise it can't give them).
4. Turn on Developer Mode in Discord (User Settings → Advanced), then right-click each channel, category and role → Copy ID.
5. Install and configure:
   ```
   npm install
   cp .env.example .env     # then fill in every ID
   npm run deploy           # registers the slash commands (re-run if you change commands)
   npm start
   ```
6. In your request-test channel run `/waitlistsetup`.

## Commands

| Command | Who | What |
|---|---|---|
| `/waitlistsetup` | Admin | Posts the request-test message in the current channel |
| `/openqueue region` | Tester | Opens the queue, adds you to Active Testers, posts the queue message with @here |
| `/addtester user region` | Tester | Adds someone to Active Testers of an open queue |
| `/next region` | Active tester | Creates `{user}-tiertest` in the open-tests category for the #1 player, DMs the new #1 |
| `/closetest` or `/closechannel` | Test's tester / Admin | Closes the test channel, starts the 7-day cooldown |
| `/closequeue region` | Tester | Deletes the queue message, posts "No Testers Online", clears queue and active testers |
| `/tier give user tier` / `/tier remove user tier` | Tester | Manages tier roles (listed in `TIER_ROLE_IDS`) |
| `/tester add user` / `/tester remove user` | Admin | Gives/removes the Tester role |

Data (verified usernames, cooldowns, queues) is stored in `data/data.json`. Back it up if you move hosts.
