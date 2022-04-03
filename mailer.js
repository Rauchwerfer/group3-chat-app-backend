const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_APIKEY)

async function sendMail(recipient, language, confirmationLink) {
  let msg
  if (language == 'eng') {
    msg = {
      to: recipient, // Change to your recipient
      from: 'noreply.m1cr0chat@gmail.com', // Change to your verified sender
      subject: 'Zapp new account',
      html: `<h2>Welcome to Zapp! </h2><br><p>Confirm your new email address by link below:</p><br>${confirmationLink}`,
    }
  }

  await sgMail
  .send(msg)
  .then((response) => {
    console.log(response)
    if (response[0].statusCode == 202)
    return true
  })
  .catch((error) => {
    console.error(error)
    return false
  })  
}

async function sendConfirmationMail(recipient, language = 'eng', confirmationLink) {
  let msg
  if (language == 'eng') {
    msg = {
      to: recipient, // Change to your recipient
      from: 'noreply.m1cr0chat@gmail.com', // Change to your verified sender
      subject: 'Zapp account new email confirmation',
      html: `<h2>Confirm your new email address by link below:</h2><br>${confirmationLink}`,
    }
  }

  await sgMail
  .send(msg)
  .then((response) => {
    console.log(response)
    if (response[0].statusCode == 202)
    return true
  })
  .catch((error) => {
    console.error(error)
    return false
  })  
}

module.exports = { sendMail, sendConfirmationMail }