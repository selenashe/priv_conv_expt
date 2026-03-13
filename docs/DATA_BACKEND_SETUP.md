# Data backend: save completions to Google Sheets

When a participant finishes the experiment (on GitHub Pages), their data is submitted to a URL you provide. This guide sets up a **Google Apps Script** that receives that data and appends one row per completion to a Google Sheet.

## 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it (e.g. "Priv Conv Expt Data").
3. The script will append rows to the **first sheet** in this workbook. You can rename that sheet to "Responses" or leave as "Sheet1".

## 2. Add the Apps Script

1. In the Google Sheet, open **Extensions → Apps Script**.
2. Delete any default code in `Code.gs` and paste the contents of **`GoogleAppsScript.gs`** from this repo (see below or the file in this directory).
3. Save the project (Ctrl/Cmd+S) and give it a name (e.g. "Expt Data Receiver").

## 3. Deploy as web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** e.g. "Receive experiment data"
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone (so the experiment on GitHub Pages can POST to it)
4. Click **Deploy**. Authorize the app when prompted (your Google account).
5. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`). This is your **Apps Script Web App URL**.

## 4. Add the URL to GitHub

1. In your GitHub repo **priv_conv_expt**, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `APPS_SCRIPT_WEB_APP_URL`
4. Value: paste the Web app URL from step 3 (the `.../exec` URL).
5. Save.

After the next push to `main` (or a manual workflow run), the build will use this URL and every experiment completion will POST data to your script, which appends a row to your sheet.

## 5. Sheet columns

The script appends one row per completion with these columns:

| Column | Content |
|--------|--------|
| A – Timestamp | When the script received the submission |
| B – participant_id | Prolific ID or generated ID |
| C – condition | A or B |
| D – consent_given | true/false |
| E – profile_trials_json | Full JSON array of profiling questions (each: profile_key, question, response, responded_at, rt) |
| F – chat_trials_json | Full JSON array of main trials (choice, final_subject, final_body, all event timestamps, etc.) |
| G – exit_survey_json | Full JSON array of exit survey responses (flat list) |
| H – exit_survey_blocks_json | Full JSON array of exit survey blocks (each: recalled_trial_id, block_shown_at, block_completed_at, survey_responses) |
| I – raw_json | Full export object (backup) |

The script writes the header row automatically when the sheet is empty. Each JSON column contains the full selections and timestamps for that stage.

## Troubleshooting

- **No data in the sheet:** Confirm the secret `APPS_SCRIPT_WEB_APP_URL` is set and the workflow ran after you added it. Re-run the "Deploy to GitHub Pages" workflow.
- **CORS or network errors:** The experiment sends data as `application/x-www-form-urlencoded` to avoid CORS preflight. If you changed the front-end to send JSON, the script must be updated to parse JSON instead of form data.
- **Quota:** Apps Script has daily quotas; for typical experiment traffic this is sufficient.
