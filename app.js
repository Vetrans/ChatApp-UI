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

function toggleSheet(btn, sheet){
  const open = sheet.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open){
    const first = sheet.querySelector('button, [tabindex]');
    first?.focus();
    const onDoc = (e) => {
      if (!sheet.contains(e.target) && !btn.contains(e.target)){
        sheet.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('mousedown', onDoc);
      }
    };
    document.addEventListener('mousedown', onDoc);
  }
}

function showToast(text){
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

attachBtn?.addEventListener('click', () => toggleSheet(attachBtn, attachPop));
emojiBtn?.addEventListener('click', () => toggleSheet(emojiBtn, emojiPop));
emojiPop?.addEventListener('click', (e) => {
  if (e.target.classList.contains('emoji')){
    input.value += e.target.textContent;
    input.focus();
  }
});

const chatList = document.querySelector('.chat-list');
if (chatList){
  let index = [...chatList.children].findIndex(li => li.classList.contains('active'));
  chatList.addEventListener('keydown', (e) => {
    const items = [...chatList.querySelectorAll('.chat-item')];
    if (e.key === 'ArrowDown'){ index = Math.min(index+1, items.length-1); items[index].focus(); e.preventDefault(); }
    if (e.key === 'ArrowUp'){ index = Math.max(index-1, 0); items[index].focus(); e.preventDefault(); }
    if (e.key === 'Enter' || e.key === ' '){ items[index].click(); e.preventDefault(); }
  });
}

document.querySelectorAll('.chat-item').forEach(item => {
  item.setAttribute('tabindex', '0');
  item.addEventListener('click', () => {
    document.querySelectorAll('.chat-item').forEach(i => {
      i.classList.remove('active'); i.setAttribute('aria-selected','false');
    });
    item.classList.add('active'); item.setAttribute('aria-selected','true');

    const title = item.querySelector('.chat-item-title')?.textContent?.trim() || 'Chat';
    document.querySelector('.thread-title').textContent = title;
    messages.scrollTop = messages.scrollHeight;

    if (window.innerWidth < 780) sidebar.classList.remove('open');
  });
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('js-copy')){
    const bubble = e.target.closest('.bubble');
    const text = bubble.innerText.trim();
    navigator.clipboard.writeText(text).then(() => showToast('Copied'));
  }
});

if (navBtn){
  navBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  // Create or append to latest "me" group
  let lastGroup = [...messages.querySelectorAll('.group')].pop();
  if (!lastGroup || !lastGroup.classList.contains('me')){
    lastGroup = document.createElement('section');
    lastGroup.className = 'group me';
    messages.appendChild(lastGroup);
  }

  const node = document.createElement('div');
  node.className = 'msg motion-pop';
  node.innerHTML = `
    <img class="avatar" src="https://i.pravatar.cc/40?img=12" alt="You" />
    <div class="bubble">
      <div class="meta"><span class="name">You</span><time>${nowHM()}</time></div>
      <p>${escapeHtml(text)}</p>
      <div class="status"><span class="tick sent"></span></div>
    </div>
  `;
  lastGroup.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => node.querySelector('.tick').classList.add('delivered'), 300);
  setTimeout(() => node.querySelector('.tick').classList.add('read'), 800);

  // Simulated assistant response with typing
  setTyping(true, 'Assistant is typing…');
  setTimeout(() => {
    setTyping(false);
    appendIncoming("Assistant", smartReply(text));
  }, 1100);
});

function appendIncoming(name, text){
  let lastGroup = [...messages.querySelectorAll('.group')].pop();
  if (!lastGroup || lastGroup.classList.contains('me')){
    lastGroup = document.createElement('section');
    lastGroup.className = 'group';
    messages.appendChild(lastGroup);
  }
  const node = document.createElement('div');
  node.className = 'msg motion-pop';
  node.innerHTML = `
    <img class="avatar" src="https://i.pravatar.cc/40?img=68" alt="${escapeHtml(name)}" />
    <div class="bubble with-actions">
      <div class="meta"><span class="name">${escapeHtml(name)}</span><time>${nowHM()}</time></div>
      <p>${escapeHtml(text)}</p>
      <div class="bubble-actions">
        <button class="icon-btn xs js-copy" aria-label="Copy message">📋</button>
        <button class="icon-btn xs">👍</button>
        <button class="icon-btn xs">👎</button>
        <button class="icon-btn xs">⋯</button>
      </div>
    </div>
  `;
  lastGroup.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  messages.scrollTop = messages.scrollHeight;
}

function setTyping(on, text='Typing…'){
  const typing = document.querySelector('.typing');
  typing.style.display = on ? 'flex' : 'none';
  const label = typing.querySelector('.typing-text');
  if (label) label.textContent = text;
}

function smartReply(prompt){
  if (/color|palette|token/i.test(prompt)) return "Try these tokens: --brand:#4F8BFF; --teal:#22D3EE; --accent:#FF7A59;";
  if (/label|font|size/i.test(prompt)) return "Increase label size to 12–13px with 700 weight, and boost contrast for accessibility.";
  if (/mesh|offline|50 ?km/i.test(prompt)) return "Add delivery retries, queue unsent messages, and show an offline badge with a resend action.";
  return "Done. Anything else to refine?";
}

function nowHM(){ return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
