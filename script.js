'use strict';

let lS = window.localStorage,
	uName = lS.getItem('uName') || prompt('Enter an alias'),
	xhr = new XMLHttpRequest(),
	chats = [ ],
	dataURL,
	loadChatsCallback,
	saveChatCallback,
	saveVoteCallback,
	voteEvent,
	detailsEvent,
	addChat,
	saveBtn = document.querySelector('#input button'),
	inputDiv = document.querySelector('#input'),
	outputDiv = document.querySelector('#output'),
	textInput = document.querySelector('#input textarea'),
	prvw = document.querySelector('#input p'),
	fileInput = document.querySelector('input[type=\'file\']');

lS.setItem('uName', uName);
xhr.open('POST', 'http://localhost:8080', true);
xhr.send(JSON.stringify({ task: 'load_chats' }));

xhr.onreadystatechange = resp => {
	if(xhr.readyState === 4 && xhr.status === 200) {
		let resp = JSON.parse(xhr.responseText);
		// console.log(xhr.responseText, resp.task);

		if(resp.task === 'load_chats')
			loadChatsCallback(resp.chats);
		else if(resp.task === 'save_chat' || resp.task === 'save_mms')
			saveChatCallback(resp);
		else if(resp.task === 'save_vote')
			saveVoteCallback(resp);
	}
};

addChat = chat => {
	let p = document.createElement('p'),
		em = document.createElement('em'),
		a = document.createElement('a'),
		span = document.createElement('span');

	if(chat.voters.indexOf(uName) >= 0) 
		p.classList.add('voted');
	
	p.id = 'c' + chat.timeStamp;
	em.innerHTML = `+${chat.voters.length}`;
	span.innerHTML = chat.text;
	a.classList.add('user');
	a.innerHTML = chat.uName;
	a.href = 'index.html#c' + chat.timeStamp;
	p.append('[', em, '] ', span, ' (', a, ')');

	if('imgURL' in chat) {
		let br = document.createElement('br');
		let img = document.createElement('img');
		img.src = chat.imgURL;
		img.alt = chat.imgURL;
		p.append(br, img);
	}
	outputDiv.appendChild(p);

	textInput.value = '';
	prvw.innerHTML = '';
	fileInput.value = '';
	dataURL = undefined;
	span.addEventListener('mouseover', detailsEvent);
	em.addEventListener('click', voteEvent);
	// console.log(span);
}

loadChatsCallback = _chats => {
	chats = _chats;
	if(!!chats.length) 
		chats.forEach(addChat)
};

saveChatCallback = chat => {
	chats.push(chat);
	addChat(chat);
};

saveVoteCallback = resp => {
	let p = document.querySelector('#c' + resp.timeStamp);
	let idx = chats.findIndex(chat => chat.timeStamp === resp.timeStamp);
	chats[idx].voters.push(resp.voter);
	p.querySelector('em').innerText = `+${chats[idx].voters.length}`;
	// console.log(p);
	p.classList.add('voted');
};

saveBtn.addEventListener('click', e => {
	if(!!textInput.value || !!fileInput.value) {
		let packet = JSON.stringify({
			uName: uName,
			text: prvw.innerHTML,
			timeStamp: Date.now(),
			imgURL: dataURL,
			task: !dataURL ? 'save_chat' : 'save_mms',
			voters: [uName]
		});

		xhr.open('POST', 'http://localhost:8080', true);
		xhr.send(packet);
	}
});

voteEvent = e => {
	// console.log('yo');
	let em = e.target;
	if( !em.parentNode.classList.contains('voted') ) {
		let packet = JSON.stringify({
			uName: em.parentNode.querySelector('a').innerText,
			timeStamp: +( em.parentNode.id.match(/\d+/)[0] ),
			task: 'save_vote',
			voter: uName
		});

		xhr.open('POST', 'http://localhost:8080', true);
		xhr.send(packet);
	} else {
		alert('You\'d already voted on this!')
	}
};

detailsEvent = e => {
	let span = e.target;
	let t = +( span.parentNode.id.match(/\d+/)[0] );
	let chat = chats.filter(_chat => _chat.timeStamp === t)[0];
	span.title = `Time: ${new Date(t)}
Voters: ${chat.voters.join(', ')}`;
};

fileInput.addEventListener('change', e => {
	let fr = new FileReader();
	fr.onload = () => {
		dataURL = fr.result.substring(fr.result.indexOf(',') + 1);
		let rem = dataURL.length % 4;
		dataURL += '='.repeat(rem);
	};
	fr.readAsDataURL(fileInput.files[0]);
});

textInput.addEventListener('input', e => {
	prvw.innerHTML = textInput.value.replace(/\n/g, '<br>');
});

// --- Additional console functions

let spam = () => {
	let alias = uName;
	uName = '~spam_bot';
	textInput.value = 'SPAM!';
	prvw.innerHTML = textInput.value.replace(/\n/g, '<br>');
	// evt = new CustomEvent('click', { detail: uName })
	saveBtn.click();
	uName = alias;
};

let wipe = () => localStorage.clear();