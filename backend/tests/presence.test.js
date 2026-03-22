import { describe, expect, it } from 'vitest';
import { MemoryPresenceStore } from '../src/socket/presence/memoryPresence.js';

describe('MemoryPresenceStore', () => {
  it('goes online with the first socket and offline only after the last', async () => {
    const presence = new MemoryPresenceStore();

    expect(await presence.add('alice', 'tab-1')).toBe(true); // came online
    expect(await presence.add('alice', 'tab-2')).toBe(false); // already online
    expect(await presence.socketCount('alice')).toBe(2);

    expect(await presence.remove('alice', 'tab-1')).toBe(false); // still has tab-2
    expect(await presence.isOnline('alice')).toBe(true);

    expect(await presence.remove('alice', 'tab-2')).toBe(true); // went offline
    expect(await presence.isOnline('alice')).toBe(false);
  });

  it('lists online users and ignores unknown removals', async () => {
    const presence = new MemoryPresenceStore();
    await presence.add('alice', 's1');
    await presence.add('bob', 's2');
    expect((await presence.onlineUserIds()).sort()).toEqual(['alice', 'bob']);
    expect(await presence.remove('carol', 'nope')).toBe(false);
  });
});
