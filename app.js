// DOM Elements
const navBtn = document.querySelector('.js-nav');
const sidebar = document.getElementById('sidebar');
const form = document.getElementById('send-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');
const attachBtn = document.querySelector('.js-attach');
const attachPop = document.getElementById('attach-pop');
const emojiBtn = document.querySelector('.js-emoji');
const emojiPop = document.getElementById('emoji-pop');
const toast = document.querySelector('.toast');
const notifPrompt = document.getElementById('notif-prompt');

// App State
let typingTimeout;
let messageCount = 0;
let isVoiceRecording = false;

// Initialize app
function init() {
  setupEventListeners();
  showNotificationPrompt();
  animateInitialElements();
  setupKeyboardShortcuts();
}

// Setup all event listeners
function setupEventListeners() {
  // Navigation
  navBtn?.addEventListener('click', () => toggleSidebar());
  
  // Sheets/Popups
  attachBtn?.addEventListener('click', () => toggleSheet(attachBtn, attachPop));
  emojiBtn?.addEventListener('click', () => toggleSheet(emojiBtn, emojiPop));
  
  // Emoji selection
  emojiPop?.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji')) {
      input.value += e.target.textContent;
      input.focus();
      closeAllSheets();
    }
  });
  
  // Chat list navigation
  setupChatList();
  
  // Chat items
  document.querySelectorAll('.chat-item').forEach(item => {
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => selectChat(item));
    
    // Delete chat button
    const deleteBtn = item.querySelector('.js-delete-chat');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(item);
    });
  });
  
  // Message actions
  document.addEventListener('click', handleMessageActions);
  
  // Form submission
  form?.addEventListener('submit', handleSubmit);
  
  // Input typing indicator
  input?.addEventListener('input', handleInputChange);
  
  // Header actions
  document.querySelector('.js-new-chat')?.addEventListener('click', createNewChat);
  document.querySelector('.js-clear')?.addEventListener('click', clearMessages);
  document.querySelector('.js-export')?.addEventListener('click', exportChat);
  document.querySelector('.js-settings')?.addEventListener('click', showSettings);
  document.querySelector('.js-sort-chats')?.addEventListener('click', sortChats);
  
  // Sidebar actions
  document.querySelector('.js-theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Details panel actions
  document.querySelector('.js-mark-read')?.addEventListener('click', markAllRead);
  document.querySelector('.js-mute')?.addEventListener('click', muteChat);
  document.querySelector('.js-archive')?.addEventListener('click', archiveChat);
  
  // Theme options
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => changeTheme(opt.dataset.theme));
  });
  
  // Suggestion buttons
  document.querySelectorAll('.js-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent.replace(/^[^\s]+\s/, '');
      input.focus();
    });
  });
  
  // Notification prompt
  document.querySelector('.js-notif-allow')?.addEventListener('click', () => {
    allowNotifications();
    hideNotificationPrompt();
  });
  
  document.querySelector('.js-notif-deny')?.addEventListener('click', hideNotificationPrompt);
  
  // Voice button
  document.querySelector('.js-voice')?.addEventListener('click', toggleVoiceRecording);
  
  // Search
  const searchInput = document.querySelector('.js-search-input');
  searchInput?.addEventListener('input', (e) => handleSearch(e.target.value));
}

// Toggle sidebar
function toggleSidebar() {
  const open = sidebar.classList.toggle('open');
  navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// Toggle sheets/popups
function toggleSheet(btn, sheet) {
  const wasOpen = sheet.classList.contains('open');
  closeAllSheets();
  
  if (!wasOpen) {
    const open = sheet.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    
    if (open) {
      const first = sheet.querySelector('button, [tabindex]');
      first?.focus();
      
      const onDoc = (e) => {
        if (!sheet.contains(e.target) && !btn.contains(e.target)) {
          closeSheet(btn, sheet);
          document.removeEventListener('mousedown', onDoc);
        }
      };
      document.addEventListener('mousedown', onDoc);
    }
  }
}

// Close all sheets
function closeAllSheets() {
  document.querySelectorAll('.sheet').forEach(sheet => {
    sheet.classList.remove('open');
  });
  [attachBtn, emojiBtn].forEach(btn => {
    btn?.setAttribute('aria-expanded', 'false');
  });
}

// Close specific sheet
function closeSheet(btn, sheet) {
  sheet.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

// Show toast notification
function showToast(text, duration = 1400) {
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Setup chat list keyboard navigation
function setupChatList() {
  const chatList = document.querySelector('.chat-list');
  if (!chatList) return;
  
  let index = [...chatList.children].findIndex(li => li.classList.contains('active'));
  
  chatList.addEventListener('keydown', (e) => {
    const items = [...chatList.querySelectorAll('.chat-item')];
    
    if (e.key === 'ArrowDown') {
      index = Math.min(index + 1, items.length - 1);
      items[index].focus();
      e.preventDefault();
    }
    
    if (e.key === 'ArrowUp') {
      index = Math.max(index - 1, 0);
      items[index].focus();
      e.preventDefault();
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      items[index].click();
      e.preventDefault();
    }
  });
}

// Select chat
function selectChat(item) {
  document.querySelectorAll('.chat-item').forEach(i => {
    i.classList.remove('active');
    i.setAttribute('aria-selected', 'false');
  });
  
  item.classList.add('active');
  item.setAttribute('aria-selected', 'true');
  
  const title = item.querySelector('.chat-item-title')?.textContent?.trim() || 'Chat';
  document.querySelector('.thread-title').textContent = title;
  
  messages.scrollTop = messages.scrollHeight;
  
  if (window.innerWidth < 780) {
    sidebar.classList.remove('open');
  }
  
  // Remove unread badge
  const badge = item.querySelector('.pill.unread');
  if (badge) {
    badge.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => badge.remove(), 300);
  }
}

// Delete chat
function deleteChat(item) {
  if (confirm('Delete this chat?')) {
    item.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => item.remove(), 300);
    showToast('Chat deleted');
  }
}

// Handle message actions (copy, like, dislike, etc.)
function handleMessageActions(e) {
  const target = e.target.closest('button');
  if (!target) return;
  
  if (target.classList.contains('js-copy')) {
    const bubble = target.closest('.bubble');
    const text = bubble.querySelector('p')?.innerText.trim() || bubble.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Copied to clipboard');
      animateButton(target);
    });
  }
  
  if (target.classList.contains('js-like')) {
    target.classList.toggle('liked');
    target.classList.remove('disliked');
    animateButton(target);
    showToast(target.classList.contains('liked') ? '👍 Liked' : 'Like removed');
  }
  
  if (target.classList.contains('js-dislike')) {
    target.classList.toggle('disliked');
    target.classList.remove('liked');
    animateButton(target);
    showToast(target.classList.contains('disliked') ? '👎 Disliked' : 'Dislike removed');
  }
  
  if (target.classList.contains('js-more')) {
    showToast('More options coming soon!');
  }
}

// Animate button on click
function animateButton(btn) {
  btn.style.animation = 'none';
  setTimeout(() => {
    btn.style.animation = 'scaleIn 0.3s';
  }, 10);
}

// Handle form submission
function handleSubmit(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  
  sendMessage(text);
  input.value = '';
  closeAllSheets();
  
  // Simulate assistant response
  setTyping(true, 'Assistant is typing…');
  setTimeout(() => {
    setTyping(false);
    receiveMessage('Assistant', smartReply(text));
  }, 1500 + Math.random() * 1000);
}

// Send user message
function sendMessage(text) {
  let lastGroup = [...messages.querySelectorAll('.group')].pop();
  
  if (!lastGroup || !lastGroup.classList.contains('me')) {
    lastGroup = document.createElement('section');
    lastGroup.className = 'group me';
    messages.appendChild(lastGroup);
  }
  
  const node = document.createElement('div');
  node.className = 'msg motion-pop';
  node.innerHTML = `
    <img class="avatar" src="https://i.pravatar.cc/40?img=12" alt="You" />
    <div class="bubble">
      <div class="meta">
        <span class="name">You</span>
        <time>${nowHM()}</time>
      </div>
      <p>${escapeHtml(text)}</p>
      <div class="status"><span class="tick sent"></span></div>
    </div>
  `;
  
  lastGroup.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  scrollToBottom();
  
  // Animate tick status
  setTimeout(() => node.querySelector('.tick').classList.add('delivered'), 300);
  setTimeout(() => node.querySelector('.tick').classList.add('read'), 800);
  
  messageCount++;
}

// Receive assistant message
function receiveMessage(name, text) {
  let lastGroup = [...messages.querySelectorAll('.group')].pop();
  
  if (!lastGroup || lastGroup.classList.contains('me')) {
    lastGroup = document.createElement('section');
    lastGroup.className = 'group';
    messages.appendChild(lastGroup);
  }
  
  const node = document.createElement('div');
  node.className = 'msg motion-pop';
  node.innerHTML = `
    <img class="avatar" src="https://i.pravatar.cc/40?img=68" alt="${escapeHtml(name)}" />
    <div class="bubble with-actions">
      <div class="meta">
        <span class="name">${escapeHtml(name)}</span>
        <time>${nowHM()}</time>
      </div>
      <p>${escapeHtml(text)}</p>
      <div class="bubble-actions">
        <button class="icon-btn xs js-copy" aria-label="Copy message" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="icon-btn xs js-like" aria-label="Like" title="Like">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
        </button>
        <button class="icon-btn xs js-dislike" aria-label="Dislike" title="Dislike">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
          </svg>
        </button>
        <button class="icon-btn xs js-more" aria-label="More options" title="More">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  lastGroup.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  scrollToBottom();
  
  messageCount++;
}

// Set typing indicator
function setTyping(on, text = 'Typing…') {
  const typing = document.querySelector('.typing');
  typing.style.display = on ? 'flex' : 'none';
  const label = typing.querySelector('.typing-text');
  if (label) label.textContent = text;
}

// Handle input change
function handleInputChange() {
  clearTimeout(typingTimeout);
  
  if (input.value.length > 0) {
    // You could send "user is typing" indicator to other users here
  }
  
  typingTimeout = setTimeout(() => {
    // User stopped typing
  }, 1000);
}

// Smart reply system
function smartReply(prompt) {
  const lower = prompt.toLowerCase();
  
  if (/color|palette|token/i.test(prompt)) {
    return "Try these tokens: --brand:#4F8BFF; --teal:#22D3EE; --accent:#FF7A59; Perfect for modern UIs!";
  }
  
  if (/label|font|size/i.test(prompt)) {
    return "Increase label size to 12–13px with 700 weight, and boost contrast for accessibility. This ensures better readability.";
  }
  
  if (/mesh|offline|50 ?km/i.test(prompt)) {
    return "Add delivery retries, queue unsent messages, and show an offline badge with a resend action. This improves reliability.";
  }
  
  if (/help|how/i.test(prompt)) {
    return "I'm here to help! You can ask me about design, development, or any questions you have. What would you like to know?";
  }
  
  if (/thank|thanks/i.test(prompt)) {
    return "You're welcome! Happy to help anytime. 😊";
  }
  
  const responses = [
    "Done! Anything else to refine?",
    "Great! I've noted that down. What's next?",
    "Perfect! Let me know if you need anything else.",
    "All set! Feel free to ask more questions.",
    "Gotcha! Anything else I can help with?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Scroll to bottom
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

// Create new chat
function createNewChat() {
  const chatList = document.querySelector('.chat-list');
  const newChat = document.createElement('li');
  newChat.className = 'chat-item slide-in';
  newChat.setAttribute('role', 'option');
  newChat.setAttribute('aria-selected', 'false');
  newChat.setAttribute('tabindex', '-1');
  newChat.innerHTML = `
    <div class="chat-item-content">
      <div class="chat-item-title">New Chat ${Date.now()}</div>
      <div class="chat-item-sub">Just now</div>
    </div>
    <div class="chat-item-meta">
      <button class="icon-btn xs js-delete-chat" aria-label="Delete chat" title="Delete">×</button>
    </div>
  `;
  
  chatList.insertBefore(newChat, chatList.firstChild);
  
  newChat.addEventListener('click', () => selectChat(newChat));
  const deleteBtn = newChat.querySelector('.js-delete-chat');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteChat(newChat);
  });
  
  selectChat(newChat);
  showToast('✓ New chat created');
}

// Clear messages
function clearMessages() {
  if (confirm('Clear all messages in this chat?')) {
    const messageDivs = messages.querySelectorAll('.msg:not(.day-sep)');
    messageDivs.forEach((msg, i) => {
      setTimeout(() => {
        msg.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => msg.remove(), 300);
      }, i * 50);
    });
    
    setTimeout(() => {
      messages.querySelectorAll('.group').forEach(g => {
        if (g.children.length === 0) g.remove();
      });
      showToast('✓ Messages cleared');
    }, messageDivs.length * 50 + 300);
  }
}

// Export chat
function exportChat() {
  const chatTitle = document.querySelector('.thread-title').textContent;
  const messageDivs = messages.querySelectorAll('.msg:not(.day-sep)');
  
  let exportText = `Chat Export: ${chatTitle}\n`;
  exportText += `Date: ${new Date().toLocaleString()}\n`;
  exportText += `${'='.repeat(50)}\n\n`;
  
  messageDivs.forEach(msg => {
    const name = msg.querySelector('.name')?.textContent || '';
    const time = msg.querySelector('time')?.textContent || '';
    const text = msg.querySelector('p')?.textContent || '';
    exportText += `[${time}] ${name}: ${text}\n`;
  });
  
  const blob = new Blob([exportText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chatTitle.replace(/\s+/g, '_')}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('✓ Chat exported');
}

// Show settings
function showSettings() {
  showToast('Settings panel coming soon!');
}

// Sort chats
function sortChats() {
  const chatList = document.querySelector('.chat-list');
  const items = [...chatList.querySelectorAll('.chat-item')];
  
  items.sort((a, b) => {
    const aTime = a.querySelector('.chat-item-sub').textContent;
    const bTime = b.querySelector('.chat-item-sub').textContent;
    return aTime.localeCompare(bTime);
  });
  
  items.forEach(item => chatList.appendChild(item));
  showToast('✓ Chats sorted');
}

// Toggle theme
function toggleTheme() {
  const themes = ['dark', 'light', 'auto'];
  const current = document.body.dataset.theme || 'dark';
  const nextIndex = (themes.indexOf(current) + 1) % themes.length;
  const next = themes[nextIndex];
  
  changeTheme(next);
}

// Change theme
function changeTheme(theme) {
  document.body.dataset.theme = theme;
  
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });
  
  showToast(`✓ Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
  
  // Save preference
  localStorage.setItem('theme', theme);
}

// Mark all as read
function markAllRead() {
  document.querySelectorAll('.pill.unread').forEach(badge => {
    badge.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => badge.remove(), 300);
  });
  showToast('✓ All marked as read');
}

// Mute chat
function muteChat() {
  showToast('🔕 Chat muted for 1 hour');
}

// Archive chat
function archiveChat() {
  if (confirm('Archive this chat?')) {
    showToast('📦 Chat archived');
  }
}

// Show notification prompt
function showNotificationPrompt() {
  if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => {
      notifPrompt?.classList.add('show');
    }, 3000);
  }
}

// Hide notification prompt
function hideNotificationPrompt() {
  notifPrompt?.classList.remove('show');
}

// Allow notifications
function allowNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showToast('✓ Notifications enabled');
        new Notification('ChatApp Pro', {
          body: 'You\'ll now receive notifications for new messages',
          icon: 'https://i.pravatar.cc/40?img=68'
        });
      }
    });
  }
}

// Toggle voice recording
function toggleVoiceRecording() {
  isVoiceRecording = !isVoiceRecording;
  const voiceBtn = document.querySelector('.js-voice');
  
  if (isVoiceRecording) {
    voiceBtn.style.background = 'rgba(239, 68, 68, .2)';
    voiceBtn.style.color = 'var(--danger)';
    showToast('🎤 Recording...');
    
    // Simulate recording
    setTimeout(() => {
      isVoiceRecording = false;
      voiceBtn.style.background = '';
      voiceBtn.style.color = '';
      input.value = 'Voice message transcribed text';
      showToast('✓ Voice recorded');
    }, 3000);
  }
}

// Handle search
function handleSearch(query) {
  const items = document.querySelectorAll('.chat-item');
  const lowerQuery = query.toLowerCase();
  
  items.forEach(item => {
    const title = item.querySelector('.chat-item-title').textContent.toLowerCase();
    const sub = item.querySelector('.chat-item-sub').textContent.toLowerCase();
    
    if (title.includes(lowerQuery) || sub.includes(lowerQuery)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Animate initial elements
function animateInitialElements() {
  const elements = document.querySelectorAll('.fade-in, .slide-in, .scale-in');
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * 50}ms`;
  });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.querySelector('.js-search-input')?.focus();
    }
    
    // Ctrl/Cmd + N: New chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewChat();
    }
    
    // Escape: Close sheets
    if (e.key === 'Escape') {
      closeAllSheets();
    }
  });
}

// Utility functions
function nowHM() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  changeTheme(savedTheme);
}

// Initialize app on load
init();