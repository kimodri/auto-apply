# 📨 PUP—Automated Internship Application

A small toolkit for **PUP** students applying for internships / OJT.

Every year the university (via **ARCDO**) shares an Excel workbook of Host Training
Establishments (HTEs) whose Memorandum of Agreement (MOA) is still valid. This project
cleans that workbook down to the companies worth contacting, then bulk-emails each one
your application with your resume attached.

## 🔎 How it works

```
ARCDO Excel  ──►  clean_htes.py  ──►  cleaned CSV  ──►  Google Sheet  ──►  send.js  ──►  emails sent
   (input)        (Python/pandas)     (datasets/)        (import)        (Apps Script)
```

1. **`clean_htes.py`** (Python) parses the Excel, keeps only rows with a valid, non-expired
   MOA and an email address, optionally filters by location, and writes a clean CSV.
2. You import that CSV into a **Google Sheet**.
3. **`send.js`** (Google Apps Script, *not* Node.js) runs inside that Sheet and emails each
   company, attaching your resume from Google Drive and marking rows as sent.

## 📋 Expected dataset schema

The input must be an **`.xlsx`** file with **one sheet per year** (named e.g. `2025`, `2026`),
where the real column headers start on **row 3** (the script skips the first 2 rows). Each
sheet should contain these columns:

| #  | Column                  | Description                                              |
|----|-------------------------|---------------------------------------------------------|
| 1  | SIGNATORY               | Authorized signatory of the MOA                         |
| 2  | POSITION                | Signatory's position / title                            |
| 3  | CONTACT NUMBER          | Company contact number                                  |
| 4  | EMAIL ADDRESS           | Where your application is sent                           |
| 5  | ADDRESS                 | Company address (used by the `--locations` filter)      |
| 6  | VALIDITY                | MOA validity duration                                   |
| 7  | NOTARIZATION DATE       | Date the MOA was notarized                              |
| 8  | EXPIRY DATE             | MOA expiry — rows already expired are dropped           |
| 9  | ACADEMIC PROGRAM        | Program the MOA covers                                  |
| 10 | SOURCE                  | Origin college / branch / campus                        |
| 11 | YEAR SUBMITTED TO ARCDO | Submission year (matches the sheet name, e.g. `2025`)   |

## ⚙️ Prerequisites

- **Python 3.x** and `pip`
- A **Google account** with access to Sheets, Drive, and Gmail
- Your **resume (PDF)** uploaded to Google Drive

## 📠 Run the Script — Part 1: Clean the data

**1. Clone the repository**

```bash
git clone <this-repo-url>
cd auto-apply
```

**2. Create and activate a virtual environment**

```powershell
# Windows (PowerShell)
python -m venv .venv
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies**

```bash
pip install pandas openpyxl
```

**4. Add your dataset**

Create a `datasets/` folder and drop the ARCDO Excel file inside, e.g.
`datasets/hte-2021-2026.xlsx`. *(The `datasets/` folder is gitignored, so your data
never gets committed.)*

**5. Run the cleaner**

```bash
python clean_htes.py datasets/hte-2021-2026.xlsx --locations Manila "Quezon City"
```

- The **path** argument (positional, required) points to your `.xlsx` file.
- `--locations` (optional) filters companies by their **ADDRESS** using a
  case-insensitive, OR-matched search — e.g. the example above keeps rows whose address
  contains *Manila* **or** *Quezon City*. Omit it to keep **all** valid rows.

**6. Outputs** — written to `datasets/`:

- `cleaned_htes.csv` — every company with a currently-valid MOA and an email.
- `cleaned_htes_<locations>.csv` — the location-filtered subset (only when `--locations` is used).

> ℹ️ `cleaned_htes.csv` is **cached**: if it already exists, the script reuses it instead of
> re-parsing the Excel. Delete `datasets/cleaned_htes.csv` to force a fresh clean.

## 📤 Run the Script — Part 2: Send the emails (Google Sheets)

> `send.js` is **Google Apps Script** that runs *inside* a Google Sheet — you don't run it
> with Node.

**1. Import the CSV into a Google Sheet**

Create a new Google Sheet and use **File → Import** to load your cleaned CSV. The columns,
in order, will be:

```
companys_name | contact_person | position | email_address | address | expiry_date | expiry_year | is_valid
```

Add a **9th column** with the header **`is_sent`** and leave it blank (or `0`). The script
uses it to avoid emailing the same company twice.

**2. Open the Apps Script editor**

In the Sheet, go to **Extensions → Apps Script** and paste the entire contents of
[`send.js`](send.js).

**3. Set your resume file ID**

Upload your resume PDF to Google Drive, then copy its file ID from the share URL
(`https://drive.google.com/file/d/FILE_ID/view`) and set it in the script:

```js
const resumeId = "FILE_ID"; // paste your Drive file ID here
```

**4. Personalize the email**

Edit the `messageBody` and `subject` in `send.js` with your name and message. Both ship
with `// TODO` placeholders (`Your Name`) — replace them before sending.

**5. Send**

Save the script, then reload the Sheet. A new **"OJT Tools"** menu appears in the toolbar —
click **OJT Tools → Send Pending Applications**. The first run will prompt you to authorize
Gmail and Drive access.

The script emails every row that has an email address and a blank/`0` `is_sent`, sets
`is_sent` to `1` after a successful send, and shows a summary popup when it finishes.

## ⚠️ Notes

- **Gmail sending limits apply** (roughly 100–500 emails/day for consumer accounts). If you
  have many prospects, run the script across multiple days.
- **Review your message and subject** before sending — these go out to real companies.
- Keep the `datasets/` folder **out of version control** (already handled by `.gitignore`).
