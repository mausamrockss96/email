document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

// Write an email
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#display-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send Post request to emails route when form submitted
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
    })
    // Interval necessary to correctly display newly sent item
    setTimeout(load_mailbox('sent'), 1000);
    return false;
  };
}

// Load a mailbox and display a clickable list of relevant emails
function load_mailbox(mailbox) {
  // Show the requested mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#display-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  // Send Ajax request to requested mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Loop through Ajax response and list email info using the list_emails function
      // Perhaps this could be streamlined using an anonymous function??
      emails.forEach(email => list_emails(email, mailbox));
  });

  // Creates a mailbox item from email data and adds it to the DOM
  function list_emails(email, mailbox){
    // Create new mailbox item
    const mailbox_item = document.createElement('div');
    // Mailbox items have diffrent background colors depending on if the email has been read.
    if (email.read == false){
      mailbox_item.className = 'mailbox_item_unread';
    }
    else{
      mailbox_item.className = 'mailbox_item_read';
    }
    // Inputing email data into mailbox item text
    mailbox_item.innerHTML = `<strong>${email.sender}</strong> \u00A0\u00A0\u00A0\u00A0${email.subject} <span style="float:right;">${email.timestamp}</span>`;

    // Add mailbox item to DOM
    document.querySelector('#emails-view').append(mailbox_item)

    // Clicking on a mailbox item displays that email
    mailbox_item.addEventListener('click', function() {
      fetch(`/emails/${email.id}`)
      .then(response => response.json())
      .then(email => {display_email(email, mailbox)});
    });

  }; //function(list_emails)
} // function (load_mailbox)

// View an email
function display_email(email, mailbox){
  // Show the display em  ail view and hide all other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#display-view').style.display = 'block';
  document.querySelector('#archive-button').onclick = () => archiver(email);
  document.querySelector('#un-archive-button').onclick = () => archiver(email);
  document.querySelector('#reply-button').onclick = () => reply(email);

  // Conditional statements to show/hide Archive and Un-Archive buttons.
  if (mailbox === 'inbox'){
    document.querySelector('#archive-button').style.display = 'inline-block';
    document.querySelector('#un-archive-button').style.display = 'none';
  }
  else if (mailbox ==='archive'){
    document.querySelector('#archive-button').style.display = 'none';
    document.querySelector('#un-archive-button').style.display = 'inline-block';
  }
  else{
    document.querySelector('#archive-button').style.display = 'none';
    document.querySelector('#un-archive-button').style.display = 'none';
  }

  // Populate HTML fields with email data
  document.querySelector('#from-field').innerHTML = `<strong>From:\u00A0</strong>${email.sender}`;
  document.querySelector('#to-field').innerHTML = `<strong>To:\u00A0</strong>${email.recipients}`;
  document.querySelector('#subject-field').innerHTML = `<strong>Subject:\u00A0</strong>${email.subject}`;
  document.querySelector('#timestamp-field').innerHTML = `<strong>Timestamp:\u00A0</strong>${email.timestamp}`;
  document.querySelector('#email-body-field').innerHTML = `${email.body}`;

  // Mark email as having been read
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
    read: true
    })
  })

};//function(display_email)

// Archive or Un-Archive an email
function archiver(email){
  // Archive email
  if (email.archived == false){
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    load_mailbox('inbox');
  }
  // Un-archive email
  else{
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    load_mailbox('inbox');
  }
};

// Reply to an email
function reply(email){
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#display-view').style.display = 'none';

  // Populate composition fields with data from original email
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote :\n\n"${email.body}"`;

  // From requirements spec "If the subject line already begins with Re: , no need to add it again"
  if (email.subject.startsWith("Re:")){
    document.querySelector('#compose-subject').value = email.subject;
  }
  else{
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }

  // Send Post request to emails route when form submitted
  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
    })
    // Interval necessary to correctly display newly sent item
    setTimeout(load_mailbox('sent'), 1000);
    return false;
  };

}//function(reply)
