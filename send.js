function sendOjtApplications() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // 0: companys_name  | 1: contact_person | 2: position | 3: email_address | 4: address
  // 5: expiry_date    | 6: expiry_year    | 7: is_valid | 8: is_sent
  
  let sentCount = 0;

  // TODO: paste your resume's Google Drive file ID here (the FILE_ID in
  // https://drive.google.com/file/d/FILE_ID/view). Leaving this empty makes
  // DriveApp.getFileById() throw, so set it before running.
  const resumeId = "";
  const resume = DriveApp.getFileById(resumeId);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    const companyName   = row[0];
    const contactPerson = row[1];
    const emailAddress  = row[3]; 
    const isSent        = row[8]; 
    
    // Only send if there is an email and is_sent is 0 (or empty)
    if (emailAddress && (isSent === 0 || isSent === "" || isSent === false)) {
      
      // The template with dynamic variables injected.
      // TODO: replace the body below with your own application message.
      const messageBody = `Dear ${contactPerson || "Hiring Manager"},

I am a student from the Polytechnic University of the Philippines writing to
apply for an internship / OJT opportunity at ${companyName || "your company"}.
Please find my resume attached for your review.

Thank you for your time and consideration.

Best regards,`;

      // Define a professional subject line.
      // TODO: put your name and target role here.
      const subject = `Internship Application - IT/Data Role - ${contactPerson || "Your Name"}`;
      
      try {
        // Send the email and ensure the resume is attached
        MailApp.sendEmail({
          to: emailAddress,
          subject: subject,
          body: messageBody,
          attachments: [resume.getAs(MimeType.PDF)]
        });
        
        // Update column I (index 9) to '1' so it isn't sent again
        sheet.getRange(i + 1, 9).setValue(1);
        sentCount++;
        
      } catch (error) {
        Logger.log(`Failed to send to ${emailAddress} on row ${i + 1}: ${error.toString()}`);
      }
    }
  }
  
  // Show a popup when finished
  const ui = SpreadsheetApp.getUi();
  if (sentCount > 0) {
    ui.alert("Success", `Successfully sent ${sentCount} application(s)!`, ui.ButtonSet.OK);
  } else {
    ui.alert("Done", "No pending rows found (all are already marked as 1).", ui.ButtonSet.OK);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  // Creates a new menu named "OJT Tools" in the top toolbar
  ui.createMenu('OJT Tools')
    .addItem('Send Pending Applications', 'sendOjtApplications')
    .addToUi();
}