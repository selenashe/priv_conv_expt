/**
 * Experiment timeline and config.
 * Runs: Consent → Profiling → Main (chat) trials → Exit survey → End (export data).
 */

import { initJsPsych } from 'jspsych';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import ConsentPlugin from './trials/consent.js';
import ProfileLikertPlugin from './trials/profile.js';
import ChatTrialPlugin from './trials/chat_trial.js';
import RecallSurveyBlockPlugin from './trials/recall_survey_block.js';
import ExitSurveyLoaderPlugin from './trials/exit_survey_loader.js';
import { scenarios } from './config/scenarios.js';
import {
  getOrCreateParticipantId,
  assignCondition,
  getAssignedOrder,
  exportAndPersist,
} from './utils/data.js';
import '../assets/styles.css';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Profile questions (1–7 Likert). From stimuli/profiling.csv stimulus_non_garden_path column.
// profile_key = domain for grouping (healthcare_information, law_enforcement_records, etc.).
// ---------------------------------------------------------------------------
const PROFILE_QUESTIONS = [
  { profile_key: 'healthcare_information', question: 'How acceptable is it to tell your course instructor that you had a medical appointment to explain a scheduling conflict?' },
  { profile_key: 'healthcare_information', question: 'How acceptable is it to tell your workplace supervisor the type of medical procedure you had to coordinate scheduling?' },
  { profile_key: 'healthcare_information', question: 'How acceptable is it to tell administrative staff specific medical details from a doctor\'s note to request accommodations?' },
  { profile_key: 'healthcare_information', question: 'How acceptable is it to tell a colleague about your stress about a recent medical procedure to ask for advice about handling work responsibilities?' },
  { profile_key: 'law_enforcement_records', question: 'How acceptable is it to tell your course instructor that you have a court appointment to explain missing a deadline?' },
  { profile_key: 'law_enforcement_records', question: 'How acceptable is it to tell your workplace supervisor that you are involved in a legal case to coordinate work responsibilities?' },
  { profile_key: 'law_enforcement_records', question: 'How acceptable is it to tell administrative staff details of a legal citation to request assistance?' },
  { profile_key: 'law_enforcement_records', question: 'How acceptable is it to tell a colleague about your worries about an ongoing legal issue to ask for advice about managing a work situation?' },
  { profile_key: 'financial_information', question: 'How acceptable is it to tell your course instructor that you had a financial appointment with a bank to explain a delay?' },
  { profile_key: 'financial_information', question: 'How acceptable is it to tell your workplace supervisor that you are experiencing financial hardship to coordinate work responsibilities?' },
  { profile_key: 'financial_information', question: 'How acceptable is it to tell administrative staff details about personal debt to request accommodations?' },
  { profile_key: 'financial_information', question: 'How acceptable is it to tell a colleague about your stress about financial problems to ask for advice about handling workplace responsibilities?' },
  { profile_key: 'education_records', question: 'How acceptable is it to tell your course instructor that you had an academic advising appointment to explain a scheduling conflict?' },
  { profile_key: 'education_records', question: 'How acceptable is it to tell your workplace supervisor information about your recent exam performance to coordinate work responsibilities?' },
  { profile_key: 'education_records', question: 'How acceptable is it to tell administrative staff a detailed explanation of failing a course to request accommodations?' },
  { profile_key: 'education_records', question: 'How acceptable is it to tell a colleague about your anxiety about academic performance to ask for advice about managing work and academic responsibilities?' },
  { profile_key: 'public_records', question: 'How acceptable is it to tell your course instructor your address listed in public records to explain a delay?' },
  { profile_key: 'public_records', question: 'How acceptable is it to tell your workplace supervisor about a public record of property ownership to coordinate scheduling?' },
  { profile_key: 'public_records', question: 'How acceptable is it to tell administrative staff details from a public legal filing about you to provide documentation when requesting accommodations?' },
  { profile_key: 'public_records', question: 'How acceptable is it to tell a colleague about your frustration about information about you being publicly available to ask for advice about handling a workplace situation?' },
];

// ---------------------------------------------------------------------------
// Exit survey questions: 3 Likert (1–7). Q2 wording depends on whether they submitted as-is or revised.
// ---------------------------------------------------------------------------
function buildExitSurveyQuestionsForBlock(editedAiDraft) {
  return [
    {
      question_key: 'concerned_personal_info',
      question: 'I was concerned that this message contained more personal information than needed.',
      left_label: 'Strongly disagree',
      right_label: 'Strongly agree',
    },
    {
      question_key: 'chose_despite_or_because',
      question: editedAiDraft
        ? "I chose to revise the draft because it contained more personal information than was needed."
        : "I chose the AI draft despite it containing more personal information than was needed.",
      left_label: 'Strongly disagree',
      right_label: 'Strongly agree',
    },
    {
      question_key: 'willing_extra_details',
      question: 'In cases like this, I am willing to include extra personal details in exchange for the convenience of using the AI draft.',
      left_label: 'Strongly disagree',
      right_label: 'Strongly agree',
    },
  ];
}

// ---------------------------------------------------------------------------
// Counterbalanced orders A–F: which variant (a,b,c) of each scenario family is shown, and in what order.
// Order table: scenario_1..5 = health, legal, education, finance, public.
// ---------------------------------------------------------------------------
const ORDER_SCENARIOS = {
  A: ['test_health_01_a', 'test_legal_01_b', 'test_education_01_c', 'test_finance_01_a', 'test_public_01_b'],
  B: ['test_health_01_b', 'test_legal_01_c', 'test_education_01_a', 'test_finance_01_b', 'test_public_01_c'],
  C: ['test_health_01_c', 'test_legal_01_a', 'test_education_01_b', 'test_finance_01_c', 'test_public_01_a'],
  D: ['test_health_01_a', 'test_legal_01_c', 'test_education_01_b', 'test_finance_01_a', 'test_public_01_c'],
  E: ['test_health_01_b', 'test_legal_01_a', 'test_education_01_c', 'test_finance_01_b', 'test_public_01_a'],
  F: ['test_health_01_c', 'test_legal_01_b', 'test_education_01_a', 'test_finance_01_c', 'test_public_01_b'],
};

// ---------------------------------------------------------------------------
// Build main trial timeline: 5 scenarios in counterbalanced order (assigned when consent given).
// ---------------------------------------------------------------------------
function buildMainTrials(condition) {
  const order = getAssignedOrder() || 'A';
  const scenarioIds = ORDER_SCENARIOS[order] || ORDER_SCENARIOS.A;
  const trials = scenarioIds.map((id) => {
    const s = scenarios.find((sc) => sc.scenario_id === id);
    if (!s) return null;
    return {
      scenario_id: s.scenario_id,
      domain: s.domain,
      recipient: s.recipient,
      condition,
      task: s.task_prompt,
      chat_context: s.chat_context,
      compose_template: s.compose_template,
      ai_draft: s.ai_draft,
      attention_check: s.attention_check ?? false,
    };
  }).filter(Boolean);
  const totalTrials = trials.length;
  trials.forEach((t, idx) => {
    t.trial_number = idx + 1;
    t.total_trials = totalTrials;
  });
  return trials;
}

const jsPsych = initJsPsych({
  on_finish: () => {
    const consentData = jsPsych.data.get().filter({ trial_type: 'consent' }).values()[0];
    if (consentData && consentData.consent_given === true) {
      const customData = {
        participant_id: consentData.participant_id || getOrCreateParticipantId(),
        condition: jsPsych.data.get().values().find((t) => t.condition)?.condition || assignCondition(consentData.participant_id || getOrCreateParticipantId()),
      };
      exportAndPersist(jsPsych, customData);
    }
  },
});

// Consent trial: if no consent, show exit and stop timeline
const consentTrial = {
  type: ConsentPlugin,
  consent_text: undefined,
  consent_label: undefined,
  no_consent_message: undefined,
  data: { task: 'consent' },
};

const consentExit = {
  type: htmlKeyboardResponse,
  stimulus: '<p class="consent-exit">Thank you for your interest. We cannot continue without your consent. You may close this page.</p>',
  choices: 'NO_KEYS',
  trial_duration: 60000,
};

// Study description (after consent): three stages in detail
const studyDescription = {
  type: htmlButtonResponse,
  stimulus: `
    <div class="info-page">
      <h2>Thank you for participating!</h2>
      <p>This study is about <strong>communication and privacy preferences</strong>. We ask you to complete a short questionnaire and then work through several message-writing tasks. Here is what to expect.</p>
      <p><strong>Part 1 — Short questionnaire (about 5 minutes)</strong></p>
      <p>You will answer a few questions about your comfort sharing personal information in different contexts and with different types of recipients. There are no right or wrong answers; we are simply interested in your preferences.</p>
      <p><strong>Part 2 — Message tasks (about 10 minutes)</strong></p>
      <p>You will see a series of hypothetical communication scenarios. In each one, you will read a short chat and a writing prompt, then either <strong>directly submit an AI-generated draft</strong> or <strong>edit that draft before submitting</strong>.</p>
      <div class="info-page-highlight">
        <p>We would like you to treat each scenario as if it were real: please respond as you would in everyday life. Your choices and wording help us understand how people approach these situations. Some scenarios touch on personal topics (e.g. health or legal matters), but you will not be asked to share any real personal details about yourself.</p>
      </div>
      <p>During the message tasks, you will see a few <strong>attention checks</strong>. They are designed to be very obvious—we use them only to confirm that participants are engaged. If you are reading and following the instructions, we are confident you will pass them without any trouble.</p>
      <p><strong>Part 3 — Reflection (about 5 minutes)</strong></p>
      <p>At the end, we will show you some of the tasks you just completed and ask you to reflect on them. For each, you will briefly see the context and your submitted message, then answer a few short questions about that scenario.</p>
      <p>Total time is typically <strong>about 10-15 minutes</strong>. Click Continue when you are ready to begin Part 1.</p>
    </div>
  `,
  choices: ['Continue'],
  css_classes: ['info-page-trial'],
};

// Info page before profiling (~5 min)
const infoBeforeProfiling = {
  type: htmlButtonResponse,
  stimulus: `
    <div class="info-page">
      <h2>Short questionnaire</h2>
      <p>Next, you will answer a few questions about your comfort sharing personal information in different contexts (e.g. medical, legal, emotional) and with different recipients.</p>
      <p><strong>Estimated time: about 5 minutes.</strong></p>
      <p>Click Continue when you are ready.</p>
    </div>
  `,
  choices: ['Continue'],
  css_classes: ['info-page-trial'],
};

// Info page before main trials (~10 min)
const infoBeforeMainTrials = {
  type: htmlButtonResponse,
  stimulus: `
    <div class="info-page">
      <h2>Message tasks</h2>
      <p>You will now complete a series of tasks. In each one, you will see a simulated chat and a writing prompt. You can then either <strong>directly submit an AI-generated draft</strong> or <strong>edit that draft before submitting</strong>. You will submit one final message per task.</p>
      <p><strong>Estimated time: about 5 minutes.</strong></p>
      <p>Click Continue when you are ready.</p>
    </div>
  `,
  choices: ['Continue'],
  css_classes: ['info-page-trial'],
};

// Instruction page before recall / exit survey (~5 min) — added at start of dynamic timeline
const instructionBeforeRecall = {
  type: htmlButtonResponse,
  stimulus: `
    <div class="info-page">
      <h2>Reflection on your tasks</h2>
      <p>You are now entering the final part of the study. We will show you <strong>the tasks you just completed</strong> and ask you to reflect on each one.</p>
      <p>For each task, you will briefly see the chat context and the message you submitted, then answer a few short questions about that scenario.</p>
      <p><strong>Estimated time: about 5 minutes.</strong></p>
      <p>Click Continue when you are ready.</p>
    </div>
  `,
  choices: ['Continue'],
  css_classes: ['info-page-trial'],
};

// Profile: one question per page (with progress bar); order randomized per participant
const profileTimeline = shuffleArray([...PROFILE_QUESTIONS]).map((q, idx) => ({
  type: ProfileLikertPlugin,
  profile_key: q.profile_key,
  question: q.question,
  trial_number: idx + 1,
  total_trials: PROFILE_QUESTIONS.length,
}));

// End screen (included in dynamically built timeline so it runs after exit survey)
const endScreen = {
  type: htmlButtonResponse,
  stimulus: `
    <p>Your response has been saved. Thank you for participating.</p>
    <p>Your completion code: <strong>[TODO: Add your completion code, e.g. for Prolific]</strong></p>
  `,
  choices: ['Finish'],
};

// Exit survey: loader builds recall+survey blocks (and end screen) and adds them to timeline.
// addNodeToEndOfTimeline appends to the *root* timeline, so we must not have endScreen in the
// main block—only in the added block—or the end screen would run before the exit survey.
function buildExitSurveyCallback() {
  return (jsPsychInstance) => {
    const chatTrials = jsPsychInstance.data.get().filter({ trial_type: 'chat_trial' }).values();
    const coreTrials = chatTrials.filter(
      (t) => !t.attention_check && t.scenario_id != null && t.choice != null
    );
    const timeline = [];
    if (coreTrials.length > 0) {
      timeline.push(instructionBeforeRecall);
      coreTrials.forEach((trialData) => {
        const scenario = scenarios.find((s) => s.scenario_id === trialData.scenario_id);
        const chat_context = scenario ? scenario.chat_context || [] : [];
        timeline.push({
          type: RecallSurveyBlockPlugin,
          chat_context,
          task: trialData.task || '',
          final_subject: trialData.final_subject ?? '',
          final_body: trialData.final_body ?? '',
          scenario_id: trialData.scenario_id ?? '',
          domain: trialData.domain ?? '',
          choice: trialData.choice ?? '',
          violation_level: trialData.violation_level ?? '',
          recalled_trial_id: trialData.trial_index ?? null,
          edited_ai_draft: trialData.edited_ai_draft === true,
          questions: buildExitSurveyQuestionsForBlock(trialData.edited_ai_draft === true),
        });
      });
    }
    timeline.push(endScreen);
    jsPsychInstance.addNodeToEndOfTimeline({ timeline });
  };
}

const exitSurveyLoaderTrial = {
  type: ExitSurveyLoaderPlugin,
  callback: buildExitSurveyCallback(),
};

const condition = assignCondition(getOrCreateParticipantId());
// timeline_variables use a getter so they are evaluated when main trials run (after consent), when assigned_order is set
const mainTrials = {
  timeline: [
    {
      type: ChatTrialPlugin,
      scenario_id: () => jsPsych.timelineVariable('scenario_id'),
      domain: () => jsPsych.timelineVariable('domain'),
      recipient: () => jsPsych.timelineVariable('recipient'),
      condition: () => jsPsych.timelineVariable('condition'),
      task: () => jsPsych.timelineVariable('task'),
      chat_context: () => jsPsych.timelineVariable('chat_context'),
      compose_template: () => jsPsych.timelineVariable('compose_template'),
      ai_draft: () => jsPsych.timelineVariable('ai_draft'),
      attention_check: () => jsPsych.timelineVariable('attention_check'),
      trial_number: () => jsPsych.timelineVariable('trial_number'),
      total_trials: () => jsPsych.timelineVariable('total_trials'),
    },
  ],
  get timeline_variables() {
    return buildMainTrials(condition);
  },
  randomize_order: false,
};

jsPsych.run([
  consentTrial,
  {
    timeline: [
      studyDescription,
      infoBeforeProfiling,
      ...profileTimeline,
      infoBeforeMainTrials,
      mainTrials,
      exitSurveyLoaderTrial,
    ],
    conditional_function: () => {
      const d = jsPsych.data.get().filter({ trial_type: 'consent' }).values()[0];
      return d && d.consent_given === true;
    },
  },
  {
    timeline: [consentExit],
    conditional_function: () => {
      const d = jsPsych.data.get().filter({ trial_type: 'consent' }).values()[0];
      return d && d.consent_given !== true;
    },
  },
]);
