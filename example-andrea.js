function sendOjtApplications() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Prompt the user for which rows to email
    const response = ui.prompt(
        "Select Rows to Email",
        "Enter the row numbers to email (e.g., '2-11' or comma-separated '2, 3, 5').\nMaximum is 10 rows:",
        ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() !== ui.Button.OK) {
        return;
    }

    const inputStr = response.getResponseText().trim();
    if (!inputStr) {
        ui.alert("Error", "Row selection cannot be empty.", ui.ButtonSet.OK);
        return;
    }

    const selectedRows = parseRowsInput(inputStr);

    if (selectedRows.length === 0) {
        ui.alert("Error", "No valid row numbers could be parsed from your input.", ui.ButtonSet.OK);
        return;
    }

    if (selectedRows.length > 10) {
        ui.alert("Error", `You selected ${selectedRows.length} rows. The maximum allowed is 10 rows.`, ui.ButtonSet.OK);
        return;
    }

    let sentCount = 0;

    const resumeId = "1lAeZLkJBNRkNNREgh1UMeFgiL5qYdxcO";
    const resume = DriveApp.getFileById(resumeId);

    for (let k = 0; k < selectedRows.length; k++) {
        const rowNumber = selectedRows[k];
        const rowIndex = rowNumber - 1; // 0-based array index

        if (rowIndex < 1 || rowIndex >= data.length) {
            Logger.log(`Skipping invalid row number: ${rowNumber}`);
            continue;
        }

        const row = data[rowIndex];

        const companyName = row[0];
        const contactPerson = row[1];
        const emailAddress = row[3];
        const isSent = row[8];

        if (emailAddress && (isSent === undefined || isSent === null || isSent === 0 || isSent === "" || isSent === false)) {
            const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">
  <p>Dear <strong>${contactPerson || "Hiring Manager"}</strong>,</p>
  
  <p>Good day! My name is <strong>Andrea Mhar De Leon</strong>, a 3rd Year student taking up Bachelor of Science in Computer Science at the <strong>Polytechnic University of the Philippines, Sta. Mesa, Manila</strong>. I am writing to express my interest in applying for the <strong>Software Developer Intern</strong> position at <strong>${companyName}</strong>.</p>
  
  <p>As part of my academic requirements, I am required to complete 200 hours of on-the-job training, and I believe <strong>${companyName}</strong> would be an excellent environment to apply and further develop my skills in a professional software development setting. I am particularly drawn to the opportunity given my background in full-stack web development and my eagerness to contribute to real-world systems.</p>
  
  <p>I have hands-on experience building full-stack web applications using React.js, Next.js, Node.js, and MongoDB, as well as PHP (Laravel) and SQL — and I am proficient in JavaScript, Java, Python, and C. I am confident that these experiences have equipped me with the technical foundation and collaborative mindset needed to contribute meaningfully to your team.</p>
  
  <p>I am available to start July 6, 2026 and can adjust to your preferred schedule.</p>
  
  <p>Attached is my resume for your review. I would be grateful for the opportunity to discuss how I can contribute to your team. Thank you for considering my application.</p>
  
  <br>
  <p style="margin-bottom: 0;">Sincerely,</p>
  <p style="margin-top: 5px; line-height: 1.4;">
    <strong>Andrea Mhar De Leon</strong><br>
    <span style="color: #666666;">BS Computer Science, 3rd Year</span><br>
    <span style="color: #666666;">Polytechnic University of the Philippines</span><br>
    <span style="color: #666666;">+63 947 637 0263</span> | <a href="mailto:dreyaamharr.deleon030@gmail.com" style="color: #1a73e8; text-decoration: none;">dreyaamharr.deleon030@gmail.com</a>
  </p>
</div>`;

            const subject = `OJT Application - Software Developer Intern - Andrea Mhar De Leon - ${companyName}`;

            try {
                // Send the email and ensure the resume is attached
                MailApp.sendEmail({
                    to: emailAddress,
                    subject: subject,
                    htmlBody: htmlBody,
                    attachments: [resume.getAs(MimeType.PDF)]
                });

                // Update column I (index 9) to '1' so it isn't sent again
                sheet.getRange(rowIndex + 1, 9).setValue(1);
                sentCount++;

            } catch (error) {
                Logger.log(`Failed to send to ${emailAddress} on row ${rowNumber}: ${error.toString()}`);
            }
        } else {
            Logger.log(`Row ${rowNumber} skipped (already sent or missing email).`);
        }
    }

    // Show a popup when finished
    if (sentCount > 0) {
        ui.alert("Success", `Successfully sent ${sentCount} application(s)!`, ui.ButtonSet.OK);
    } else {
        ui.alert("Done", "No pending rows were processed.", ui.ButtonSet.OK);
    }
}

function parseRowsInput(inputStr) {
    const rows = [];
    const parts = inputStr.split(',');
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (!part) continue;
        if (part.indexOf('-') !== -1) {
            const rangeParts = part.split('-');
            if (rangeParts.length === 2) {
                const start = parseInt(rangeParts[0].trim(), 10);
                const end = parseInt(rangeParts[1].trim(), 10);
                if (!isNaN(start) && !isNaN(end)) {
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let r = min; r <= max; r++) {
                        if (rows.indexOf(r) === -1) {
                            rows.push(r);
                        }
                    }
                }
            }
        } else {
            const r = parseInt(part, 10);
            if (!isNaN(r)) {
                if (rows.indexOf(r) === -1) {
                    rows.push(r);
                }
            }
        }
    }
    return rows.sort((a, b) => a - b);
}

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    // Creates a new menu named "OJT Tools" in the top toolbar
    ui.createMenu('OJT Tools')
        .addItem('Send Pending Applications', 'sendOjtApplications')
        .addToUi();
}