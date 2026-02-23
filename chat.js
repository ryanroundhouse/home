(() => {
  'use strict';

  const CHAT_PROFILE_KEY = 'rg_chat_profile_v1';
  const CHAT_ACTIVE_ROOM_KEY = 'rg_chat_active_room_v1';
  const CHAT_MUTE_KEY = 'rg_chat_mute_v1';
  const CHAT_SESSION_KEY = 'rg_chat_session_v1';
  const MAX_MESSAGES_PER_ROOM = 500;
  const DEFAULT_ROOM_NAME = 'lobby';
  const DEFAULT_STATUS_MS = 2200;
  const CHAT_PROTOCOL = 'rg-chat-v1';
  const CHAT_WS_URL = 'wss://rgbot.graham.pub:8443';
  const HEARTBEAT_MS = 25000;
  const MAX_RECONNECT_MS = 10000;

  const state = {
    ws: null,
    heartbeatTimer: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    didConnectOnce: false,
    roomMessages: Object.create(null),
    rooms: [],
    profile: null,
    activeRoomId: '',
    selectedRoomId: '',
    pendingJoinRoomId: '',
    pendingCreateRoomName: '',
    sessionId: '',
    statusTimer: null,
    muted: false,
    userInteracted: false,
    soundFx: {
      ping: null,
      gong: null,
    },
    audioCtx: null,
    audioEnabled: false,
  };

  const els = {};

  document.addEventListener('DOMContentLoaded', () => {
    cacheEls();
    if (!els.root) return;

    state.profile = loadProfile();
    state.sessionId = loadSessionId();
    state.activeRoomId = loadActiveRoomId() || roomIdFromName(DEFAULT_ROOM_NAME);
    state.selectedRoomId = state.activeRoomId;
    state.muted = loadMuted();

    ensurePlaceholderRoom(DEFAULT_ROOM_NAME);

    initForms();
    initRoomListInteractions();
    initShortcuts();
    loadSoundEffects();
    initAudioUnlock();

    renderAll();
    connectSocket();
  });

  function cacheEls() {
    els.root = document.querySelector('.chat-shell');
    els.status = document.getElementById('chatStatus');
    els.profileForm = document.getElementById('chatProfileForm');
    els.nameInput = document.getElementById('chatNameInput');
    els.avatarPreview = document.getElementById('chatAvatarPreview');
    els.rerollAvatar = document.getElementById('chatRerollAvatar');
    els.roomForm = document.getElementById('chatRoomForm');
    els.roomInput = document.getElementById('chatRoomInput');
    els.roomList = document.getElementById('chatRoomList');
    els.activeRoomName = document.getElementById('chatActiveRoomName');
    els.roomMeta = document.getElementById('chatRoomMeta');
    els.messages = document.getElementById('chatMessages');
    els.composer = document.getElementById('chatComposer');
    els.messageInput = document.getElementById('chatMessageInput');
    els.muteToggle = document.getElementById('chatMuteToggle');
  }

  function initForms() {
    els.profileForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProfileNameFromInput();
    });

    els.nameInput?.addEventListener('change', () => {
      saveProfileNameFromInput();
    });

    els.rerollAvatar?.addEventListener('click', () => {
      rerollAvatar();
    });

    els.roomForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      createOrJoinTypedRoom();
    });

    els.composer?.addEventListener('submit', (e) => {
      e.preventDefault();
      sendComposerMessage();
    });

    els.muteToggle?.addEventListener('click', () => {
      state.muted = !state.muted;
      saveMuted();
      renderMuteToggle();
      setStatus(state.muted ? 'Sound muted' : 'Sound on');
    });
  }

  function initRoomListInteractions() {
    els.roomList?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-room-id]');
      if (!btn) return;
      joinRoom(String(btn.dataset.roomId || ''));
      btn.focus();
    });

    els.roomList?.addEventListener('keydown', (e) => {
      const rooms = getRoomsSorted();
      if (!rooms.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveSelectedRoom(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveSelectedRoom(-1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        const btn = e.target.closest('button[data-room-id]');
        if (!btn) return;
        e.preventDefault();
        joinRoom(String(btn.dataset.roomId || ''));
      }
    });
  }

  function initShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (isTerminalOpen()) return;
      const target = e.target;
      const isTypingTarget = target instanceof HTMLElement && (
        target.matches('input, textarea, [contenteditable="true"]')
      );
      const key = e.key;
      const lower = key.toLowerCase();
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      if (metaOrCtrl && lower === 'k') {
        e.preventDefault();
        els.roomInput?.focus();
        els.roomInput?.select();
        return;
      }
      if (metaOrCtrl && lower === 'l') {
        e.preventDefault();
        els.messageInput?.focus();
        els.messageInput?.select();
        return;
      }
      if (e.altKey && lower === 'n') {
        e.preventDefault();
        els.nameInput?.focus();
        els.nameInput?.select();
        return;
      }
      if (e.altKey && lower === 'r') {
        e.preventDefault();
        createOrJoinTypedRoom();
        return;
      }
      if (e.altKey && lower === 'a') {
        e.preventDefault();
        rerollAvatar();
        return;
      }

      if (isTypingTarget) return;

      if (key === '[') {
        e.preventDefault();
        moveSelectedRoom(-1, true);
        return;
      }
      if (key === ']') {
        e.preventDefault();
        moveSelectedRoom(1, true);
      }
    });
  }

  function initAudioUnlock() {
    const unlock = () => {
      state.userInteracted = true;
      void ensureAudioContext();
      primeSoundEffects();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }

  function connectSocket() {
    if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) return;

    clearReconnectTimer();
    setStatus(state.didConnectOnce ? 'Reconnecting…' : 'Connecting…', 4000);

    let ws;
    try {
      ws = new WebSocket(CHAT_WS_URL);
    } catch {
      scheduleReconnect('WebSocket init failed');
      return;
    }

    state.ws = ws;

    ws.addEventListener('open', () => {
      state.reconnectAttempt = 0;
      state.didConnectOnce = true;
      sendHello();
      startHeartbeat();
      setStatus('Connected', 1500);
    });

    ws.addEventListener('message', (event) => {
      handleSocketMessage(event.data);
    });

    ws.addEventListener('error', () => {
      setStatus('Socket error', 2000);
    });

    ws.addEventListener('close', () => {
      stopHeartbeat();
      if (state.ws === ws) state.ws = null;
      scheduleReconnect('Disconnected');
    });
  }

  function sendHello() {
    safeSend({
      type: 'hello',
      protocol: CHAT_PROTOCOL,
      sessionId: state.sessionId,
      profile: {
        name: state.profile.name,
        avatarId: state.profile.avatarId,
      },
      resumeRoomId: state.pendingJoinRoomId || state.activeRoomId || roomIdFromName(DEFAULT_ROOM_NAME),
    });
  }

  function handleSocketMessage(raw) {
    let payload;
    try {
      payload = JSON.parse(String(raw));
    } catch {
      setStatus('Invalid server message', 1800);
      return;
    }
    if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') return;

    switch (payload.type) {
      case 'welcome':
        onWelcome(payload);
        break;
      case 'room_list':
        onRoomList(payload);
        break;
      case 'joined_room':
        onJoinedRoom(payload);
        break;
      case 'message':
        onRoomMessage(payload);
        break;
      case 'profile_ack':
        onProfileAck(payload);
        break;
      case 'pong':
        break;
      case 'error':
        onServerError(payload);
        break;
      default:
        // Ignore unknown message types for forward compatibility.
        break;
    }
  }

  function onWelcome(payload) {
    if (payload.protocol && payload.protocol !== CHAT_PROTOCOL) {
      setStatus(`Protocol mismatch (${payload.protocol})`, 3500);
    }

    if (payload.self && typeof payload.self === 'object') {
      state.profile.name = normalizeDisplayName(payload.self.name || state.profile.name);
      state.profile.avatarId = sanitizeAvatarId(payload.self.avatarId ?? state.profile.avatarId);
      if (payload.self.clientId) state.profile.clientId = String(payload.self.clientId);
      saveProfile();
      renderProfile();
    }

    if (Array.isArray(payload.rooms)) {
      state.rooms = payload.rooms.map(normalizeServerRoom).filter(Boolean);
      if (!state.rooms.length) ensurePlaceholderRoom(DEFAULT_ROOM_NAME);
      renderRooms();
    }

    let desiredRoomId = payload.activeRoomId
      || state.pendingJoinRoomId
      || state.activeRoomId
      || getRoomsSorted()[0]?.id
      || roomIdFromName(DEFAULT_ROOM_NAME);

    if (state.pendingCreateRoomName) {
      safeSend({ type: 'create_room', name: state.pendingCreateRoomName });
    } else if (!getRoomById(desiredRoomId)) {
      safeSend({ type: 'create_room', name: DEFAULT_ROOM_NAME });
      desiredRoomId = roomIdFromName(DEFAULT_ROOM_NAME);
    }

    joinRoom(desiredRoomId, { silent: true });
  }

  function onRoomList(payload) {
    if (!Array.isArray(payload.rooms)) return;
    state.rooms = payload.rooms.map(normalizeServerRoom).filter(Boolean);
    if (!state.rooms.length) ensurePlaceholderRoom(DEFAULT_ROOM_NAME);
    if (!getRoomById(state.activeRoomId)) {
      state.activeRoomId = getRoomsSorted()[0]?.id || roomIdFromName(DEFAULT_ROOM_NAME);
      saveActiveRoomId(state.activeRoomId);
    }
    if (!getRoomById(state.selectedRoomId)) state.selectedRoomId = state.activeRoomId;
    renderRooms();
    renderActiveRoomHeader();
  }

  function onJoinedRoom(payload) {
    const room = normalizeJoinedRoom(payload.room);
    if (!room) return;
    const messages = Array.isArray(payload.messages)
      ? payload.messages.map(normalizeServerMessage).filter(Boolean).slice(-MAX_MESSAGES_PER_ROOM)
      : [];

    upsertRoomMeta(room, { messageCount: Math.max(room.messageCount || 0, messages.length), lastMessageTs: messages[messages.length - 1]?.ts || room.lastMessageTs || null });
    state.roomMessages[room.id] = messages;
    state.activeRoomId = room.id;
    state.selectedRoomId = room.id;
    state.pendingJoinRoomId = '';
    state.pendingCreateRoomName = '';
    saveActiveRoomId(room.id);

    renderRooms();
    renderActiveRoom();
    scrollMessagesToBottom();
    setStatus(`Joined #${room.name}`);
  }

  function onRoomMessage(payload) {
    const roomId = String(payload.roomId || '').trim();
    const message = normalizeServerMessage(payload.message);
    if (!roomId || !message) return;

    const list = Array.isArray(state.roomMessages[roomId]) ? state.roomMessages[roomId] : [];
    if (!list.some((m) => m.id === message.id)) {
      list.push(message);
      if (list.length > MAX_MESSAGES_PER_ROOM) list.splice(0, list.length - MAX_MESSAGES_PER_ROOM);
      state.roomMessages[roomId] = list;
    }

    const room = getRoomById(roomId);
    if (room) {
      room.lastMessageTs = message.ts;
      room.messageCount = Math.max(Number(room.messageCount || 0) + 1, list.length);
    } else {
      upsertRoomMeta({ id: roomId, name: roomId, createdAt: Date.now(), messageCount: list.length, lastMessageTs: message.ts });
    }

    renderRooms();
    if (roomId === state.activeRoomId) {
      renderMessagesForActiveRoom();
      scrollMessagesToBottom();
      playMessageSound(message);
    }
  }

  function onProfileAck(payload) {
    if (!payload.self || typeof payload.self !== 'object') return;
    state.profile.name = normalizeDisplayName(payload.self.name || state.profile.name);
    state.profile.avatarId = sanitizeAvatarId(payload.self.avatarId ?? state.profile.avatarId);
    if (payload.self.clientId) state.profile.clientId = String(payload.self.clientId);
    saveProfile();
    renderProfile();
    setStatus('Profile updated');
  }

  function onServerError(payload) {
    const msg = String(payload.message || 'Server error');
    setStatus(msg, 3200);
  }

  function startHeartbeat() {
    stopHeartbeat();
    state.heartbeatTimer = window.setInterval(() => {
      safeSend({ type: 'ping', ts: Date.now() });
    }, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }
  }

  function scheduleReconnect(label) {
    clearReconnectTimer();
    state.reconnectAttempt += 1;
    const delay = Math.min(MAX_RECONNECT_MS, 750 * (2 ** Math.min(state.reconnectAttempt - 1, 4)));
    setStatus(`${label} — retrying in ${(delay / 1000).toFixed(delay >= 1000 ? 1 : 0)}s`, 4000);
    state.reconnectTimer = window.setTimeout(() => {
      state.reconnectTimer = null;
      connectSocket();
    }, delay);
  }

  function clearReconnectTimer() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }
  }

  function safeSend(payload) {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return false;
    try {
      state.ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function createOrJoinTypedRoom() {
    const raw = String(els.roomInput?.value || '').trim();
    if (!raw) {
      setStatus('Type a room name first');
      els.roomInput?.focus();
      return;
    }

    const roomName = normalizeRoomName(raw);
    const roomId = roomIdFromName(roomName);
    if (!roomId) {
      setStatus('Invalid room name');
      return;
    }

    ensurePlaceholderRoom(roomName);
    state.selectedRoomId = roomId;
    state.pendingJoinRoomId = roomId;
    state.pendingCreateRoomName = roomName;
    renderRooms();

    if (els.roomInput) els.roomInput.value = roomName;

    if (!isSocketOpen()) connectSocket();
    safeSend({ type: 'create_room', name: roomName });
    safeSend({ type: 'join_room', roomId });
    setStatus(`Joining #${roomName}…`);
  }

  function joinRoom(roomId, { silent = false } = {}) {
    const id = String(roomId || '').trim();
    if (!id) return;
    state.selectedRoomId = id;
    state.pendingJoinRoomId = id;
    if (getRoomById(id)) state.pendingCreateRoomName = '';

    if (!getRoomById(id)) {
      upsertRoomMeta({ id, name: id, createdAt: Date.now(), messageCount: 0, lastMessageTs: null });
    }

    renderRooms();
    if (!isSocketOpen()) {
      connectSocket();
      if (!silent) setStatus('Connecting…');
      return;
    }

    safeSend({ type: 'join_room', roomId: id });
    if (!silent) setStatus(`Joining #${id}…`);
  }

  function moveSelectedRoom(delta, joinImmediately = false) {
    const rooms = getRoomsSorted();
    if (!rooms.length) return;
    let index = rooms.findIndex((room) => room.id === state.selectedRoomId);
    if (index < 0) index = rooms.findIndex((room) => room.id === state.activeRoomId);
    if (index < 0) index = 0;
    index = (index + delta + rooms.length) % rooms.length;
    state.selectedRoomId = rooms[index].id;
    renderRooms();
    const targetBtn = els.roomList?.querySelector(`button[data-room-id="${cssEscape(state.selectedRoomId)}"]`);
    targetBtn?.focus();
    if (joinImmediately) joinRoom(state.selectedRoomId);
  }

  function saveProfileNameFromInput() {
    if (!state.profile || !els.nameInput) return;
    const raw = String(els.nameInput.value || '').trim();
    if (!raw) {
      setStatus('Name is required');
      els.nameInput.value = state.profile.name;
      return;
    }
    if (/\s/.test(raw)) {
      setStatus('Names cannot contain spaces');
      els.nameInput.value = state.profile.name;
      return;
    }

    state.profile.name = normalizeDisplayName(raw);
    saveProfile();
    renderProfile();
    if (isSocketOpen()) {
      safeSend({ type: 'set_profile', name: state.profile.name, avatarId: state.profile.avatarId });
      setStatus(`Updating name to ${state.profile.name}…`);
    } else {
      setStatus(`Name set to ${state.profile.name} (will sync on connect)`);
      connectSocket();
    }
  }

  function rerollAvatar() {
    if (!state.profile) return;
    state.profile.avatarId = randomInt(1, 9999);
    saveProfile();
    renderProfile();
    if (isSocketOpen()) safeSend({ type: 'set_profile', name: state.profile.name, avatarId: state.profile.avatarId });
    setStatus('Avatar rerolled');
  }

  function sendComposerMessage() {
    const roomId = state.activeRoomId;
    if (!roomId) {
      setStatus('Join a room first');
      return;
    }
    const raw = String(els.messageInput?.value || '').trim();
    if (!raw) return;

    const parsed = parseOutgoingMessage(raw);
    if (!parsed) {
      setStatus('Cannot send an empty emote');
      return;
    }

    if (!isSocketOpen()) {
      setStatus('Not connected to chat server');
      connectSocket();
      return;
    }

    const ok = safeSend({
      type: 'send_message',
      roomId,
      message: {
        type: parsed.type,
        text: parsed.text,
      },
    });

    if (!ok) {
      setStatus('Failed to send');
      return;
    }

    if (els.messageInput) {
      els.messageInput.value = '';
      els.messageInput.focus();
    }
    setStatus('Sent');
  }

  function parseOutgoingMessage(raw) {
    const trimmed = raw.trim();
    const emoteMatch = trimmed.match(/^\/emote\s+(.+)$/i);
    if (emoteMatch) {
      const text = emoteMatch[1].trim();
      if (!text) return null;
      return { type: 'emote', text: text.slice(0, 400) };
    }
    if (!trimmed) return null;
    return { type: 'message', text: trimmed.slice(0, 400) };
  }

  function renderAll() {
    renderProfile();
    renderMuteToggle();
    renderRooms();
    renderActiveRoom();
  }

  function renderProfile() {
    if (!state.profile) return;
    if (els.nameInput && document.activeElement !== els.nameInput) {
      els.nameInput.value = state.profile.name;
    }
    if (els.avatarPreview) {
      els.avatarPreview.innerHTML = avatarSvgMarkup(state.profile.avatarId);
      els.avatarPreview.setAttribute('title', `Avatar ${state.profile.avatarId}`);
    }
  }

  function renderMuteToggle() {
    if (!els.muteToggle) return;
    els.muteToggle.textContent = state.muted ? 'Sound Off' : 'Sound On';
    els.muteToggle.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
  }

  function renderRooms() {
    if (!els.roomList) return;
    const rooms = getRoomsSorted();
    if (!rooms.length) {
      els.roomList.innerHTML = '';
      return;
    }

    if (!rooms.some((r) => r.id === state.selectedRoomId)) state.selectedRoomId = rooms[0].id;

    const frag = document.createDocumentFragment();
    for (const room of rooms) {
      const li = document.createElement('li');
      li.className = 'chat-room-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-room-btn';
      if (room.id === state.activeRoomId) btn.classList.add('is-active');
      if (room.id === state.selectedRoomId) btn.classList.add('is-selected');
      btn.dataset.roomId = room.id;
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', room.id === state.activeRoomId ? 'true' : 'false');
      btn.tabIndex = room.id === state.selectedRoomId ? 0 : -1;

      const title = document.createElement('div');
      title.className = 'chat-room-btn-top';
      title.textContent = `#${room.name}`;

      const meta = document.createElement('div');
      meta.className = 'chat-room-btn-meta';
      const count = Number(room.messageCount || 0);
      const lastTs = Number(room.lastMessageTs || 0);
      meta.textContent = lastTs
        ? `${count} msg${count === 1 ? '' : 's'} • ${formatRoomListTime(lastTs)}`
        : (count ? `${count} msg${count === 1 ? '' : 's'}` : 'No messages yet');

      btn.append(title, meta);
      li.appendChild(btn);
      frag.appendChild(li);
    }

    els.roomList.innerHTML = '';
    els.roomList.appendChild(frag);
    els.roomList.querySelectorAll('button[data-room-id]').forEach((btn) => {
      btn.id = `room-${btn.dataset.roomId}`;
    });
    els.roomList.setAttribute('aria-activedescendant', `room-${state.selectedRoomId}`);
  }

  function renderActiveRoom() {
    renderActiveRoomHeader();
    renderMessagesForActiveRoom();
  }

  function renderActiveRoomHeader() {
    const room = getRoomById(state.activeRoomId) || getRoomById(state.selectedRoomId) || getRoomsSorted()[0] || null;
    if (!room) return;
    if (!state.activeRoomId) state.activeRoomId = room.id;
    if (els.activeRoomName) els.activeRoomName.textContent = `#${room.name}`;

    const messages = Array.isArray(state.roomMessages[room.id]) ? state.roomMessages[room.id] : [];
    const displayedCount = messages.length;
    const total = Number(room.messageCount || displayedCount);
    if (els.roomMeta) {
      if (total > displayedCount) {
        els.roomMeta.textContent = `${total} messages (${displayedCount} loaded, max ${MAX_MESSAGES_PER_ROOM})`;
      } else {
        els.roomMeta.textContent = `${displayedCount} message${displayedCount === 1 ? '' : 's'} (max ${MAX_MESSAGES_PER_ROOM})`;
      }
    }
  }

  function renderMessagesForActiveRoom() {
    const roomId = state.activeRoomId || state.selectedRoomId;
    const messages = Array.isArray(state.roomMessages[roomId]) ? state.roomMessages[roomId] : [];
    renderMessages(messages);
  }

  function renderMessages(messages) {
    if (!els.messages) return;
    const nearBottom = isNearBottom(els.messages);
    const frag = document.createDocumentFragment();

    if (!messages.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-empty';
      if (isSocketOpen()) empty.textContent = 'No messages yet. Say something or use /emote wave';
      else empty.textContent = 'Connecting to chat server…';
      frag.appendChild(empty);
    } else {
      for (const msg of messages) frag.appendChild(renderMessageNode(msg));
    }

    els.messages.innerHTML = '';
    els.messages.appendChild(frag);
    if (nearBottom) scrollMessagesToBottom();
  }

  function renderMessageNode(msg) {
    const article = document.createElement('article');
    article.className = 'chat-message';
    if (msg.type === 'emote') article.classList.add('is-emote');
    if (msg.authorId === state.profile?.clientId) article.classList.add('is-self');

    const avatar = document.createElement('div');
    avatar.className = 'chat-message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = avatarSvgMarkup(msg.avatarId);

    const body = document.createElement('div');
    body.className = 'chat-message-body';

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';

    const name = document.createElement('span');
    name.className = 'chat-message-name';
    name.textContent = msg.name;

    const time = document.createElement('time');
    time.className = 'chat-message-time';
    time.dateTime = new Date(msg.ts).toISOString();
    time.textContent = formatMessageTime(msg.ts);

    meta.append(name, time);

    const content = document.createElement('div');
    content.className = 'chat-message-content';
    content.textContent = msg.type === 'emote' ? `* ${msg.name} ${msg.text}` : msg.text;

    body.append(meta, content);
    article.append(avatar, body);
    return article;
  }

  function ensurePlaceholderRoom(name) {
    const displayName = normalizeRoomName(name);
    const id = roomIdFromName(displayName);
    if (!id) return null;
    if (getRoomById(id)) return getRoomById(id);
    const room = {
      id,
      name: displayName,
      createdAt: Date.now(),
      messageCount: 0,
      lastMessageTs: null,
    };
    state.rooms.push(room);
    return room;
  }

  function upsertRoomMeta(room, overrides = {}) {
    if (!room || !room.id) return null;
    const existing = getRoomById(room.id);
    if (existing) {
      existing.name = room.name || existing.name;
      existing.createdAt = Number.isFinite(room.createdAt) ? room.createdAt : existing.createdAt;
      if (overrides.messageCount != null) existing.messageCount = Number(overrides.messageCount) || 0;
      else if (room.messageCount != null) existing.messageCount = Number(room.messageCount) || 0;
      if (overrides.lastMessageTs != null) existing.lastMessageTs = Number(overrides.lastMessageTs) || null;
      else if (room.lastMessageTs != null) existing.lastMessageTs = Number(room.lastMessageTs) || null;
      return existing;
    }
    const next = {
      id: String(room.id),
      name: normalizeRoomName(room.name || room.id),
      createdAt: Number.isFinite(room.createdAt) ? room.createdAt : Date.now(),
      messageCount: Number(overrides.messageCount ?? room.messageCount ?? 0) || 0,
      lastMessageTs: Number(overrides.lastMessageTs ?? room.lastMessageTs ?? 0) || null,
    };
    state.rooms.push(next);
    return next;
  }

  function getRoomById(id) {
    return state.rooms.find((room) => room.id === id) || null;
  }

  function getRoomsSorted() {
    return [...state.rooms].sort((a, b) => {
      const aTs = Number(a.lastMessageTs || 0) || Number(a.createdAt || 0) || 0;
      const bTs = Number(b.lastMessageTs || 0) || Number(b.createdAt || 0) || 0;
      if (bTs !== aTs) return bTs - aTs;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  function normalizeServerRoom(room) {
    if (!room || typeof room !== 'object') return null;
    const id = roomIdFromName(room.id || room.name || '');
    if (!id) return null;
    return {
      id,
      name: normalizeRoomName(room.name || id),
      createdAt: Number.isFinite(room.createdAt) ? room.createdAt : Date.now(),
      messageCount: Number(room.messageCount || 0) || 0,
      lastMessageTs: Number(room.lastMessageTs || 0) || null,
    };
  }

  function normalizeJoinedRoom(room) {
    const normalized = normalizeServerRoom(room);
    if (normalized) return normalized;
    return null;
  }

  function normalizeServerMessage(msg) {
    if (!msg || typeof msg !== 'object') return null;
    const text = String(msg.text || '').trim();
    if (!text) return null;
    return {
      id: String(msg.id || randomId('msg')),
      ts: Number.isFinite(msg.ts) ? msg.ts : Date.now(),
      authorId: String(msg.authorId || ''),
      name: normalizeDisplayName(msg.name || 'anon'),
      avatarId: sanitizeAvatarId(msg.avatarId),
      type: msg.type === 'emote' ? 'emote' : 'message',
      text: text.slice(0, 400),
    };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(CHAT_PROFILE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        return {
          clientId: String(parsed.clientId || ''),
          name: normalizeDisplayName(parsed.name || 'guest'),
          avatarId: sanitizeAvatarId(parsed.avatarId),
        };
      }
    } catch {
      // ignore
    }
    const profile = {
      clientId: '',
      name: `guest${randomInt(100, 999)}`,
      avatarId: randomInt(1, 9999),
    };
    try {
      localStorage.setItem(CHAT_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
    return profile;
  }

  function saveProfile() {
    try {
      localStorage.setItem(CHAT_PROFILE_KEY, JSON.stringify(state.profile));
    } catch {
      setStatus('Could not save profile');
    }
  }

  function loadSessionId() {
    try {
      const existing = String(localStorage.getItem(CHAT_SESSION_KEY) || '').trim();
      if (existing) return existing;
    } catch {
      // ignore
    }
    const id = randomId('session');
    try {
      localStorage.setItem(CHAT_SESSION_KEY, id);
    } catch {
      // ignore
    }
    return id;
  }

  function loadActiveRoomId() {
    try {
      return String(localStorage.getItem(CHAT_ACTIVE_ROOM_KEY) || '');
    } catch {
      return '';
    }
  }

  function saveActiveRoomId(roomId) {
    try {
      localStorage.setItem(CHAT_ACTIVE_ROOM_KEY, roomId);
    } catch {
      // ignore
    }
  }

  function loadMuted() {
    try {
      return localStorage.getItem(CHAT_MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function saveMuted() {
    try {
      localStorage.setItem(CHAT_MUTE_KEY, state.muted ? '1' : '0');
    } catch {
      // ignore
    }
  }

  function setStatus(text, ms = DEFAULT_STATUS_MS) {
    if (!els.status) return;
    els.status.textContent = text;
    clearTimeout(state.statusTimer);
    state.statusTimer = window.setTimeout(() => {
      if (!els.status) return;
      els.status.textContent = isSocketOpen() ? 'Connected' : 'Disconnected';
    }, ms);
  }

  function normalizeDisplayName(name) {
    const cleaned = String(name || '').trim().replace(/\s+/g, '');
    const fallback = cleaned || `guest${randomInt(100, 999)}`;
    return fallback.slice(0, 24);
  }

  function normalizeRoomName(name) {
    const raw = String(name || '').trim();
    if (!raw) return DEFAULT_ROOM_NAME;
    return raw.replace(/\s+/g, ' ').slice(0, 40);
  }

  function roomIdFromName(name) {
    const base = String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '');
    return base;
  }

  function sanitizeAvatarId(value) {
    const n = Number.parseInt(String(value), 10);
    if (!Number.isFinite(n) || n <= 0) return randomInt(1, 9999);
    return n;
  }

  function formatMessageTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatRoomListTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function isNearBottom(el) {
    if (!el) return true;
    return (el.scrollHeight - el.scrollTop - el.clientHeight) < 64;
  }

  function scrollMessagesToBottom() {
    if (!els.messages) return;
    els.messages.scrollTop = els.messages.scrollHeight;
  }

  function isSocketOpen() {
    return !!state.ws && state.ws.readyState === WebSocket.OPEN;
  }

  function isTerminalOpen() {
    const overlay = document.getElementById('terminalOverlay');
    return !!overlay && !overlay.hidden;
  }

  async function ensureAudioContext() {
    if (state.audioCtx) {
      if (state.audioCtx.state === 'suspended') {
        try { await state.audioCtx.resume(); } catch { /* ignore */ }
      }
      state.audioEnabled = state.audioCtx.state === 'running';
      return state.audioCtx;
    }

    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      state.audioCtx = new Ctor();
      if (state.audioCtx.state === 'suspended') await state.audioCtx.resume();
      state.audioEnabled = state.audioCtx.state === 'running';
      return state.audioCtx;
    } catch {
      state.audioCtx = null;
      state.audioEnabled = false;
      return null;
    }
  }

  function playMessageSound(message) {
    if (state.muted) return;
    if (hasMentionForCurrentUser(message.text)) {
      void playGong();
    } else {
      void playPing();
    }
  }

  function hasMentionForCurrentUser(text) {
    const name = state.profile?.name;
    if (!name) return false;
    const re = new RegExp(`(^|[^A-Za-z0-9_-])@${escapeRegex(name)}(?=$|[^A-Za-z0-9_-])`, 'i');
    return re.test(String(text || ''));
  }

  async function playPing() {
    if (await playSoundFile('ping')) return;
    const ctx = await ensureAudioContext();
    if (!ctx || !state.audioEnabled || state.muted) return;
    const now = ctx.currentTime;
    beep(ctx, { time: now, freq: 880, duration: 0.09, gain: 0.03, type: 'triangle' });
    beep(ctx, { time: now + 0.06, freq: 1320, duration: 0.08, gain: 0.025, type: 'sine' });
  }

  async function playGong() {
    if (await playSoundFile('gong')) return;
    const ctx = await ensureAudioContext();
    if (!ctx || !state.audioEnabled || state.muted) return;
    const now = ctx.currentTime;
    beep(ctx, { time: now, freq: 220, duration: 0.45, gain: 0.045, type: 'sine' });
    beep(ctx, { time: now + 0.01, freq: 330, duration: 0.55, gain: 0.03, type: 'triangle' });
    beep(ctx, { time: now + 0.015, freq: 440, duration: 0.5, gain: 0.018, type: 'sine' });
  }

  function beep(ctx, { time, freq, duration, gain, type }) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, time);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), time + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  function loadSoundEffects() {
    state.soundFx.ping = makeAudio('./assets/sounds/chat-ping.wav');
    state.soundFx.gong = makeAudio('./assets/sounds/chat-gong.wav');
  }

  function makeAudio(src) {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      return audio;
    } catch {
      return null;
    }
  }

  async function primeSoundEffects() {
    // Best-effort: load/prime local audio after a user gesture. Ignore failures.
    const audios = [state.soundFx.ping, state.soundFx.gong].filter(Boolean);
    for (const audio of audios) {
      try {
        audio.load();
      } catch {
        // ignore
      }
    }
  }

  async function playSoundFile(kind) {
    if (state.muted) return false;
    const audio = state.soundFx[kind];
    if (!audio) return false;
    try {
      const node = audio.cloneNode(true);
      node.volume = kind === 'gong' ? 0.65 : 0.45;
      await node.play();
      return true;
    } catch {
      return false;
    }
  }

  function avatarSvgMarkup(avatarId) {
    const palette = [
      ['#42e7ff', '#ff3df2', '#54ff9a'],
      ['#8a5bff', '#42e7ff', '#ff6bcb'],
      ['#54ff9a', '#42e7ff', '#ffd166'],
      ['#ff7a90', '#8a5bff', '#42e7ff'],
      ['#f97316', '#fb7185', '#38bdf8'],
      ['#34d399', '#60a5fa', '#f472b6'],
    ];
    const shapes = ['circle', 'diamond', 'ring', 'bars'];
    const set = palette[avatarId % palette.length];
    const shape = shapes[avatarId % shapes.length];
    const eye = 6 + (avatarId % 5);
    const mouth = 19 + (avatarId % 4);

    let centerShape = '';
    if (shape === 'circle') {
      centerShape = `<circle cx="16" cy="16" r="7" fill="${set[1]}" opacity=".75" />`;
    } else if (shape === 'diamond') {
      centerShape = `<path d="M16 8 L24 16 L16 24 L8 16 Z" fill="${set[1]}" opacity=".7" />`;
    } else if (shape === 'ring') {
      centerShape = `<circle cx="16" cy="16" r="8" fill="none" stroke="${set[1]}" stroke-width="3" opacity=".8" />`;
    } else {
      centerShape = `<g opacity=".75"><rect x="9" y="9" width="3" height="14" rx="1" fill="${set[1]}"/><rect x="14.5" y="7" width="3" height="18" rx="1" fill="${set[2]}"/><rect x="20" y="11" width="3" height="10" rx="1" fill="${set[1]}"/></g>`;
    }

    return `
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">
        <defs>
          <linearGradient id="g-${avatarId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${set[0]}" />
            <stop offset="100%" stop-color="${set[1]}" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="rgba(10,8,24,.75)" stroke="url(#g-${avatarId})" stroke-width="1.5" />
        <circle cx="16" cy="16" r="12" fill="url(#g-${avatarId})" opacity=".18" />
        ${centerShape}
        <circle cx="${eye}" cy="13" r="1.2" fill="${set[0]}" opacity=".9" />
        <circle cx="${32 - eye}" cy="13" r="1.2" fill="${set[0]}" opacity=".9" />
        <path d="M11 ${mouth} Q16 ${mouth + 2} 21 ${mouth}" fill="none" stroke="${set[2]}" stroke-width="1.6" stroke-linecap="round" opacity=".9" />
      </svg>`;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }
})();
