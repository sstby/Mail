document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('form').onsubmit = (e) => submit_composed_email(e);

  let answer_btn = document.querySelector('#answer-btn');
  answer_btn.addEventListener('click', () => {
    let recipient = answer_btn.dataset.recipient;
    let subject = answer_btn.dataset.subject;
    let subject_start = subject.slice(0, 3);
    if (subject_start != 'Re:'){
      subject = 'Re: '  + subject;
    }
    let text = answer_btn.dataset.body;
    let date = answer_btn.dataset.timestamp;
    let body = `On ${date} ${recipient} texted:\n${text}\n`;

    compose_email(recipient, subject, body);
  })

  let archive_btn = document.querySelector('#archive-btn');
  archive_btn.addEventListener('click', () => {
    let message_id = archive_btn.dataset.id;
    let query = '/emails/' + message_id;
    fetch(query, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archive_btn.innerText == 'Archive' ? true : false
      })
    })
    load_mailbox('inbox');
  })

  // By default, load the inbox
  load_mailbox('inbox');
  
  //Блокировка отправки сообщение до введения тела сообщения
  const form_submit = document.querySelector('#submit');
  const form_body = document.querySelector('#compose-body');
  form_submit.disabled = true;
  form_body.onkeyup = () => {
    if (form_body.value.length > 0){
      form_submit.disabled = false;
    }
    else {
      form_submit.disabled = true;
    }
  }
});

//Отправка формы
function submit_composed_email(e) {
  e.preventDefault();
  let recipients = document.querySelector('#compose-recipients');
  let subject = document.querySelector('#compose-subject');
  let body = document.querySelector('#compose-body');
  if (subject.value == ''){
    subject.value = 'No subject';
  }
  fetch('/emails', {
    method : 'POST',
    body : JSON.stringify({
      recipients: recipients.value,
      subject : subject.value, 
      body : body.value
    })
  })
  load_mailbox('sent');
}

//Загрузка формы
function compose_email(recipient=null, subject=null, body=null) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';
  document.querySelector('#messages-block').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  if (recipient && subject){
    document.querySelector('#compose-recipients').value = recipient;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
    document.querySelector('textarea').focus();
  }
  else {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  
}

//Функция для создания блока сообщения
function make_message_view(message){
  const div = document.createElement('div');
  if (message.read){
    div.setAttribute('class', 'message unread')
  }
  else {
    div.setAttribute('class', 'message read')
  }
  const sender_element = document.createElement('span');
  const subject_element = document.createElement('span');
  const date_element = document.createElement('span');
  sender_element.innerHTML = message.sender;
  subject_element.innerHTML = message.subject;
  date_element.innerHTML = message.timestamp;

  div.append(sender_element);
  div.append(subject_element);
  div.append(date_element);

  div.addEventListener('click', function() {
      load_message(message.id);
  });
  return div;
}

//Загрузка сообщения
function load_message(message_id) {
  document.querySelector('#message-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#messages-block').style.display = 'none';

  message = document.querySelector('#read-message');
  if (message){
    message.remove();
  }

  query = '/emails/' + message_id;
  fetch(query)
  .then(response => response.json())
  .then(email => {
    if (document.querySelector('h2').innerText == email.sender) {
      document.querySelector('#message-controls').style.display = 'none';
    }

    let message_block = document.querySelector('#message-view');
    let message = document.createElement('div');
    message.setAttribute('id', 'read-message');
    message_block.append(message);
    
    let from_to = document.createElement('h4');
    from_to.innerHTML = `From ${email.sender} to ${email.recipients}`;
    message.append(from_to);

    let date = document.createElement('p');
    date.innerHTML = `at ${email.timestamp}`;
    message.append(date);

    let subject = document.createElement('h5');
    subject.innerHTML = email.subject;
    message.append(subject);

    let body = document.createElement('p');
    body.innerHTML = email.body;
    message.append(body);

    let answer_btn = document.querySelector('#answer-btn');
    answer_btn.setAttribute('data-recipient', email.sender);
    answer_btn.setAttribute('data-subject', email.subject);
    answer_btn.setAttribute('data-body', email.body);
    answer_btn.setAttribute('data-timestamp', email.timestamp);

    let archive_btn = document.querySelector('#archive-btn');
    archive_btn.setAttribute('data-id', email.id);
    if (email.archived){
      archive_btn.setAttribute('class', 'btn btn-outline-primary');
      archive_btn.innerText = 'Unarchive';
    }else{
      archive_btn.setAttribute('class', 'btn btn-primary');
      archive_btn.innerText = 'Archive';
    }
  })

  fetch(query, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  
}

//Загрузка ящика
function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#message-view').style.display = 'none';

  //Предварительная очистка с прошлого перехода
  messages = document.querySelector('#messages-block');
  if (messages){
    messages.remove();
  }
  let query = '/emails/' + mailbox
  fetch(query)
  .then(response => response.json())
  .then(emails => {
    let parant_div = document.createElement('div');
    parant_div.setAttribute('id', 'messages-block');
    document.querySelector('.container').append(parant_div);
    emails.forEach(message => {
      const div = make_message_view(message);
      document.querySelector('#messages-block').append(div);
      
    });
  });
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}