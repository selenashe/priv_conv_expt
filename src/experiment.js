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
import { scenarios, ATTENTION_CHECK_EVERY_N_TRIALS } from './config/scenarios.js';
import {
  getOrCreateParticipantId,
  assignCondition,
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
// Profile questions (1–7 Likert). TODO: Replace with your actual questions.
// profile_key used for score aggregation: medical_score, legal_score, emotional_score, recipient_trust_score.
// ---------------------------------------------------------------------------
const PROFILE_QUESTIONS = [
  { profile_key: 'medical', question: 'How acceptable is it for you to share that you had a medical appointment with your course instructor to explain a scheduling conflict?' },
  { profile_key: 'medical', question: 'How acceptable is it for you to share the type of medical procedure you had with your workplace supervisor to coordinate scheduling?' },
  // { profile_key: 'legal', question: 'I am comfortable sharing personal information in legal or official contexts when required.' },
  // { profile_key: 'legal', question: 'I am comfortable disclosing relevant personal details to authorities or legal representatives.' },
  // { profile_key: 'emotional', question: 'I am comfortable sharing emotional or mental health related information with people I trust.' },
  // { profile_key: 'emotional', question: 'I am comfortable discussing my wellbeing in contexts where it is relevant (e.g. support services).' },
  // { profile_key: 'recipient_trust', question: 'I would be comfortable sharing sensitive personal information with course staff if needed.' },
  // { profile_key: 'recipient_trust', question: 'I would be comfortable sharing sensitive personal information with my employer if required.' },
  // { profile_key: 'recipient_trust', question: 'I would be comfortable sharing sensitive personal information with a close friend.' },
];

// ---------------------------------------------------------------------------
// Exit survey questions (1–7 Likert). TODO: Replace with your actual questions.
// ---------------------------------------------------------------------------
const EXIT_SURVEY_QUESTIONS = [
  {
    question_key: 'norm_acceptability',
    question: 'How appropriate do you think it was to share this information with this recipient in this situation?'
  },
  {
    question_key: 'comfort_recipient',
    question: 'How comfortable would you be if the intended recipient actually read the message you submitted?'
  },
  {
    question_key: 'would_send_real',
    question: 'If this situation happened in real life, how likely would you be to send exactly the same message you submitted here?'
  },
  {
    question_key: 'ai_influence',
    question: 'To what extent did the AI-generated draft influence how much information you decided to include in your final message?'
  }
];

// ---------------------------------------------------------------------------
// Build main trial timeline: randomize order, interleave attention checks.
// ---------------------------------------------------------------------------
function buildMainTrials(condition) {
  const attentionChecks = scenarios.filter((s) => s.attention_check);
  const mainScenarios = scenarios.filter((s) => !s.attention_check);
  const shuffled = shuffleArray(mainScenarios);
  const trials = [];
  let attnIndex = 0;
  for (let i = 0; i < shuffled.length; i++) {
    trials.push({
      scenario_id: shuffled[i].scenario_id,
      domain: shuffled[i].domain,
      recipient: shuffled[i].recipient,
      condition,
      task: shuffled[i].task_prompt,
      chat_context: shuffled[i].chat_context,
      compose_template: shuffled[i].compose_template,
      ai_draft: shuffled[i].ai_draft,
      attention_check: false,
    });
    if ((i + 1) % ATTENTION_CHECK_EVERY_N_TRIALS === 0 && attnIndex < attentionChecks.length) {
      const ac = attentionChecks[attnIndex++];
      trials.push({
        scenario_id: ac.scenario_id,
        domain: ac.domain,
        recipient: ac.recipient,
        condition,
        task: ac.task_prompt,
        chat_context: ac.chat_context,
        compose_template: ac.compose_template,
        ai_draft: ac.ai_draft,
        attention_check: true,
      });
    }
  }
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
      <p>You will see a series of hypothetical communication scenarios. In each one, you will read a short chat and a writing prompt, then either <strong>write the message yourself</strong> or <strong>use an AI-generated draft</strong> and edit it if you like.</p>
      <div class="info-page-highlight">
        <p>We would like you to treat each scenario as if it were real: please respond as you would in everyday life. Your choices and wording help us understand how people approach these situations. Some scenarios touch on personal topics (e.g. health or legal matters), but you will not be asked to share any real personal details about yourself.</p>
      </div>
      <p>During the message tasks, you will see a few <strong>attention checks</strong>. They are designed to be very obvious—we use them only to confirm that participants are engaged. If you are reading and following the instructions, we are confident you will pass them without any trouble.</p>
      <p><strong>Part 3 — Reflection (about 5 minutes)</strong></p>
      <p>At the end, we will show you some of the tasks you just completed and ask you to reflect on them. For each, you will briefly see the context and your submitted message, then answer a few short questions about that scenario.</p>
      <p>Total time is typically <strong>about 20–30 minutes</strong>. Click Continue when you are ready to begin Part 1.</p>
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
      <p>You will now complete a series of tasks. In each one, you will see a simulated chat and a writing prompt. You can either <strong>write the message yourself</strong> or <strong>use an AI-generated draft</strong> (and edit it if you like). You will submit one final message per task.</p>
      <p><strong>Estimated time: about 10 minutes.</strong></p>
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
      <p>You are now entering the final part of the study. We will show you <strong>two of the tasks you just completed</strong> and ask you to reflect on them.</p>
      <p>For each task, you will briefly see the chat context and the message you submitted, then answer a few short questions about that scenario.</p>
      <p><strong>Estimated time: about 5 minutes.</strong></p>
      <p>Click Continue when you are ready.</p>
    </div>
  `,
  choices: ['Continue'],
  css_classes: ['info-page-trial'],
};

// Profile: one question per page
const profileTimeline = PROFILE_QUESTIONS.map((q) => ({
  type: ProfileLikertPlugin,
  profile_key: q.profile_key,
  question: q.question,
}));

// End screen (included in dynamically built timeline so it runs after exit survey)
const endScreen = {
  type: htmlButtonResponse,
  stimulus: `
    <p>Thank you for completing the study.</p>
    <p>Your completion code: <strong>[TODO: Add your completion code, e.g. for Prolific]</strong></p>
    <p>Your data has been downloaded (JSON and CSV). A copy has been saved in this browser for recovery.</p>
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
    const n = Math.min(2, coreTrials.length);
    const timeline = [];
    if (n > 0) {
      timeline.push(instructionBeforeRecall);
      const selected = jsPsychInstance.randomization.sampleWithoutReplacement(coreTrials, n);
      selected.forEach((trialData) => {
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
          questions: EXIT_SURVEY_QUESTIONS,
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
  timeline_variables: buildMainTrials(condition),
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
