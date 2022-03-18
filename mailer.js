const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_APIKEY)

async function sendMail(recipient, language, confirmationLink) {
  let msg
  if (language == 'eng') {
    msg = {
      to: recipient, // Change to your recipient
      from: 'noreply.m1cr0chat@gmail.com', // Change to your verified sender
      subject: 'Confirm our email address',
      html: `<h2>Welcome to M1cr0chat!</h2><br><a href="${confirmationLink}" target="_blank">Confirm email by this link</a><br><p>Or copy link below:</p><br>${confirmationLink}`,
    }
  }

  await sgMail
  .send(msg)
  .then((response) => {
    if (response[0].statusCode == 202)
    return true
  })
  .catch((error) => {
    console.error(error)
    return false
  })  
}

module.exports = sendMail