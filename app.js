const navBtn = document.querySelector('.js-nav');
const sidebar = document.querySelector('.sidebar');
const form = document.getElementById('send-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');

if (navBtn){
  navBtn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

document.querySelectorAll('.chat-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    // demo: update header
    const title = item.querySelector('.chat-item-title')?.textContent?.trim() || 'Chat';
    document.querySelector('.thread-title').textContent = title;
    messages.scrollTop = messages.scrollHeight;
    if (window.innerWidth < 780) sidebar.classList.remove('open');
  });
});

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const node = document.createElement('article');
  node.className = 'msg me motion-pop';
  node.innerHTML = `
    <img class="avatar" src="https://i.pravatar.cc/40?img=12" alt="You" />
    <div class="bubble">
      <div class="meta"><span class="name">You</span><time>${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</time></div>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
  messages.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Simulate inbound reply
  setTimeout(() => {
    const reply = document.createElement('article');
    reply.className = 'msg motion-pop';
    reply.innerHTML = `
      <img class="avatar" src="https://i.pravatar.cc/40?img=31" alt="Aarav" />
      <div class="bubble">
        <div class="meta"><span class="name">Aarav</span><time>${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</time></div>
        <p>Got it. We’ll integrate with the offline mesh when ready.</p>
      </div>
    `;
    messages.appendChild(reply);
    requestAnimationFrame(() => reply.classList.add('in'));
    messages.scrollTop = messages.scrollHeight;
  }, 600);
});

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
