const socket = io();
const ROOM_ID = window.ROOM_ID || 'default-room';
const CURRENT_USER = window.CURRENT_USER || 'guest';
socket.emit('join_live', { room_id: ROOM_ID });
function sendComment(){ const input = document.getElementById('commentInput'); if(!input || !input.value.trim()) return; socket.emit('send_comment', { room_id: ROOM_ID, user: CURRENT_USER, text: input.value.trim() }); input.value=''; }
function sendHeart(){ socket.emit('send_heart', { room_id: ROOM_ID }); }
function sendGift(gift){ socket.emit('send_gift', { room_id: ROOM_ID, user: CURRENT_USER, gift: gift }); }
socket.on('new_comment', (data)=>{ const box = document.getElementById('comments'); if(box){ box.innerHTML += `<div>${data.user}: ${data.text}</div>`; }});
socket.on('new_heart', ()=>{ const heart = document.createElement('div'); heart.className='heart'; heart.innerHTML='❤️'; document.body.appendChild(heart); setTimeout(()=>heart.remove(),2000); });
socket.on('new_gift', (data)=>{ const gift = document.createElement('div'); gift.className='gift'; gift.innerHTML = `${data.user} sent ${data.gift}`; document.body.appendChild(gift); setTimeout(()=>gift.remove(),3000); });
window.sendComment=sendComment; window.sendHeart=sendHeart; window.sendGift=sendGift;
