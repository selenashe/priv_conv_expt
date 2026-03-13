/**
 * Participant id, condition assignment, and data export.
 * All experiment data is keyed by participant_id for crash recovery (localStorage).
 */

const PARTICIPANT_STORAGE_KEY_PREFIX = 'privacy_norm_expt_';
const CONDITION_LABELS = ['A', 'B'];

/**
 * Generate or retrieve participant_id. In production you might pass via URL.
 */
export function getOrCreateParticipantId() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromUrl = urlParams.get('participant_id') || urlParams.get('PROLIFIC_PID');
  if (fromUrl) return fromUrl;
  const stored = localStorage.getItem('privacy_norm_expt_participant_id');
  if (stored) return stored;
  const generated = 'P_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  localStorage.setItem('privacy_norm_expt_participant_id', generated);
  return generated;
}

/**
 * Assign condition based on participant_id hash (deterministic per participant).
 */
export function assignCondition(participantId) {
  let hash = 0;
  for (let i = 0; i < participantId.length; i++) {
    const char = participantId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % CONDITION_LABELS.length;
  return CONDITION_LABELS[index];
}

/**
 * Build full data object from jsPsych data and our custom keys.
 */
export function buildExportData(jsPsych, customData = {}) {
  const participantId = customData.participant_id || getOrCreateParticipantId();
  const condition = customData.condition ?? assignCondition(participantId);
  const allTrials = jsPsych.data.get().values();
  const consent = allTrials.find((t) => t.trial_type === 'consent') || {};
  const profileTrials = allTrials.filter((t) => t.trial_type === 'profile_likert');
  const chatTrials = allTrials.filter((t) => t.trial_type === 'chat_trial');
  const exitTrials = allTrials.filter((t) => t.trial_type === 'exit_survey_likert');
  const recallSurveyBlocks = allTrials.filter((t) => t.trial_type === 'recall_survey_block');

  const data = {
    participant_id: participantId,
    condition,
    consent: {
      age: consent.age,
      gender: consent.gender,
      prolific_id: consent.prolific_id ?? consent.participant_id,
      consent_given: consent.consent_given,
      consent_submitted_at: consent.consent_submitted_at ?? null,
    },
    profile_trials: profileTrials.map((t) => ({
      profile_key: t.profile_key,
      question: t.question,
      response: t.response,
      responded_at: t.responded_at ?? null,
      rt: t.rt,
    })),
    chat_trials: chatTrials.map((t) => ({
      scenario_id: t.scenario_id,
      condition: t.condition,
      task: t.task,
      recipient: t.recipient,
      choice: t.choice,
      final_subject: t.final_subject,
      final_body: t.final_body,
      edited_ai_draft: t.edited_ai_draft,
      edit_char_delta: t.edit_char_delta,
      violation_level: t.violation_level,
      attention_check: t.attention_check,
      chose_ai_on_attention_check: t.attention_check && t.choice === 'ai',
      rt: t.rt,
      trial_start: t.trial_start,
      trial_end: t.trial_end,
      task_and_draft_shown_at: t.task_and_draft_shown_at ?? null,
      submit_as_is_clicked_at: t.submit_as_is_clicked_at ?? null,
      revise_clicked_at: t.revise_clicked_at ?? null,
      back_clicked_at: t.back_clicked_at ?? [],
      draft_submit_clicked_at: t.draft_submit_clicked_at ?? null,
      trial_ended_at: t.trial_ended_at ?? null,
    })),
    exit_survey_blocks: recallSurveyBlocks.map((t) => ({
      recalled_trial_id: t.recalled_trial_id ?? null,
      scenario_id: t.scenario_id ?? '',
      domain: t.domain ?? '',
      block_shown_at: t.block_shown_at ?? null,
      block_completed_at: t.block_completed_at ?? null,
      survey_responses: t.survey_responses ?? [],
    })),
    exit_survey: [
      ...exitTrials.map((t) => ({
        question_key: t.question_key,
        survey_question_id: t.survey_question_id ?? t.question_key,
        survey_response: t.survey_response ?? t.response,
        question: t.question,
        response: t.response,
        rt: t.rt,
        recalled_trial_id: t.recalled_trial_id ?? null,
        recalled_domain: t.recalled_domain ?? null,
        user_choice: t.user_choice ?? null,
        violation_level: t.violation_level ?? null,
      })),
      ...recallSurveyBlocks.flatMap((t) =>
        (t.survey_responses || []).map((r) => ({
          question_key: r.question_key,
          survey_question_id: r.question_key,
          survey_response: r.survey_response,
          question: r.question,
          response: r.survey_response,
          rt: null,
          recalled_trial_id: t.recalled_trial_id ?? null,
          recalled_domain: t.domain ?? null,
          user_choice: t.choice ?? null,
          violation_level: t.violation_level ?? null,
        }))
      ),
    ],
    ...customData,
  };

  return data;
}

/**
 * Flatten for CSV (one row per participant, with trial/survey columns expanded or JSON stringified as needed).
 */
export function dataToCsvRows(data) {
  const rows = [];
  const header = [
    'participant_id',
    'condition',
    'age',
    'gender',
    'prolific_id',
    'consent_given',
    'consent_submitted_at',
    'profile_trials_json',
    'chat_trials_json',
    'exit_survey_json',
    'exit_survey_blocks_json',
  ];
  rows.push(header.join(','));

  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const r = [
    data.participant_id,
    data.condition,
    data.consent?.age ?? '',
    data.consent?.gender ?? '',
    data.consent?.prolific_id ?? '',
    data.consent?.consent_given ?? '',
    data.consent?.consent_submitted_at ?? '',
    JSON.stringify(data.profile_trials || []),
    JSON.stringify(data.chat_trials || []),
    JSON.stringify(data.exit_survey || []),
    JSON.stringify(data.exit_survey_blocks || []),
  ];
  rows.push(r.map(escape).join(','));
  return rows.join('\n');
}

/**
 * Download a string as a file.
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Save data to localStorage keyed by participant_id (crash recovery).
 */
export function saveToLocalStorage(data) {
  const key = PARTICIPANT_STORAGE_KEY_PREFIX + data.participant_id;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }
}

/** URL for submitting data (e.g. Google Apps Script web app). Set at build with VITE_DATA_SUBMIT_URL. */
const DATA_SUBMIT_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DATA_SUBMIT_URL;

/**
 * Try to save results to the project's results/ directory via the dev server API.
 * No-op if the endpoint is not available (e.g. production or file://).
 */
export function saveToLocalDirectory(data, csv) {
  const payload = { data, csv };
  fetch('/api/save-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

/**
 * Submit results to external endpoint (e.g. Google Apps Script). No-op if DATA_SUBMIT_URL is not set.
 * Sends as form-urlencoded to avoid CORS preflight so Apps Script can receive without CORS headers.
 */
export function submitToBackend(data, csv) {
  if (!DATA_SUBMIT_URL || typeof fetch === 'undefined') return;
  const payload = { data: JSON.stringify(data), csv: csv || '' };
  const body = new URLSearchParams(payload).toString();
  fetch(DATA_SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {});
}

/**
 * Export and download JSON + CSV, persist to localStorage, save to local results/ when under dev server, and submit to backend when URL is set.
 */
export function exportAndPersist(jsPsych, customData = {}) {
  const data = buildExportData(jsPsych, customData);
  saveToLocalStorage(data);
  const json = JSON.stringify(data, null, 2);
  const csv = dataToCsvRows(data);
  const pid = data.participant_id;
  downloadFile(json, `privacy_norm_expt_${pid}.json`, 'application/json');
  downloadFile(csv, `privacy_norm_expt_${pid}.csv`, 'text/csv;charset=utf-8');
  saveToLocalDirectory(data, csv);
  submitToBackend(data, csv);
  return data;
}
