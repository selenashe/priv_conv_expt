/**
 * Recall + exit survey on one page: shows recalled scenario and all Likert questions
 * with scrolling if needed. One Continue button; records all responses in one trial.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'recall_survey_block',
  parameters: {
    chat_context: { type: ParameterType.COMPLEX, default: [] },
    task: { type: ParameterType.STRING, default: '' },
    final_subject: { type: ParameterType.STRING, default: '' },
    final_body: { type: ParameterType.STRING, default: '' },
    scenario_id: { type: ParameterType.STRING, default: '' },
    domain: { type: ParameterType.STRING, default: '' },
    choice: { type: ParameterType.STRING, default: '' },
    violation_level: { type: ParameterType.STRING, default: '' },
    recalled_trial_id: { type: ParameterType.INT, default: null },
    edited_ai_draft: { type: ParameterType.BOOL, default: false },
    questions: { type: ParameterType.COMPLEX, default: [] },
    left_label: { type: ParameterType.STRING, default: 'Strongly disagree' },
    right_label: { type: ParameterType.STRING, default: 'Strongly agree' },
    min: { type: ParameterType.INT, default: 1 },
    max: { type: ParameterType.INT, default: 7 },
  },
};

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function getSenderLabel(speaker) {
  return speaker === 'user' ? 'You' : 'dot (AI)';
}

function getAvatarChar(speaker) {
  return speaker === 'user' ? 'Y' : 'd';
}

function buildRecallHtml(trial) {
  const chatContext = trial.chat_context || [];
  const task = trial.task || '';
  const finalSubject = (trial.final_subject || '').trim();
  const finalBody = (trial.final_body || '').trim();
  const bubblesHtml = chatContext
    .map((msg) => {
      const senderLabel = getSenderLabel(msg.speaker);
      const avatarChar = getAvatarChar(msg.speaker);
      const text = escapeHtml(msg.text).replace(/\n/g, '<br>');
      const side = msg.speaker === 'user' ? 'chat-bubble-user' : '';
      return `
        <div class="chat-bubble chat-bubble-${msg.speaker} ${side}" role="listitem">
          <span class="chat-avatar" aria-hidden="true">${escapeHtml(avatarChar)}</span>
          <div class="chat-bubble-content">
            <span class="chat-sender">${escapeHtml(senderLabel)}</span>
            <p class="chat-text">${text}</p>
          </div>
        </div>
      `;
    })
    .join('');
  const submissionHtml =
    finalSubject && finalBody
      ? `<p><strong>Subject:</strong> ${escapeHtml(finalSubject)}</p><div class="recall-submission-body">${escapeHtml(finalBody).replace(/\n/g, '<br>')}</div>`
      : `<div class="recall-submission-body">${escapeHtml(finalBody).replace(/\n/g, '<br>')}</div>`;
  const choseText = trial.edited_ai_draft
    ? 'You chose to revise the draft.'
    : 'You chose to submit the draft as-is.';
  return `
    <div class="recall-trial-container">
      <h2 class="recall-title">Recall this task and your submission</h2>
      <div class="recall-chat-window chat-window">
        <div class="chat-messages">${bubblesHtml}</div>
      </div>
      <div class="recall-task-prompt task-prompt">${escapeHtml(task)}</div>
      <div class="recall-submission">
        <h3 class="recall-submission-title">Your submission</h3>
        <div class="recall-submission-content">${submissionHtml}</div>
        <p class="recall-choice-summary">${escapeHtml(choseText)}</p>
      </div>
    </div>
  `;
}

class RecallSurveyBlockPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const t0 = performance.now();
    const questions = trial.questions || [];
    const min = trial.min ?? 1;
    const max = trial.max ?? 7;
    const range = max - min + 1;
    const options = Array.from({ length: range }, (_, i) => min + i);
    const leftLabel = trial.left_label ?? 'Strongly disagree';
    const rightLabel = trial.right_label ?? 'Strongly agree';

    const recallHtml = buildRecallHtml(trial);
    const surveyBlocks = questions.map((q, idx) => {
      const name = 'recall_survey_' + trial.recalled_trial_id + '_' + idx + '_' + Math.random().toString(36).slice(2, 9);
      const isChoice = Array.isArray(q.options) && q.options.length > 0;
      let blockContent;
      if (isChoice) {
        const choiceLabels = q.options.map(
          (opt) =>
            `<label class="recall-survey-choice-option"><input type="radio" name="${name}" value="${escapeHtml(opt)}" /> <span>${escapeHtml(opt)}</span></label>`
        );
        blockContent = `
          <div class="recall-survey-choices" role="radiogroup" aria-label="${(q.question || '').replace(/"/g, '&quot;')}">
            ${choiceLabels.join('')}
          </div>`;
      } else {
        const qLeft = q.left_label != null ? q.left_label : leftLabel;
        const qRight = q.right_label != null ? q.right_label : rightLabel;
        const labels = options.map(
          (v) =>
            `<label class="likert-option"><input type="radio" name="${name}" value="${v}" /> <span>${v}</span></label>`
        );
        blockContent = `
          <div class="likert-labels">
            <span class="likert-left">${escapeHtml(qLeft)}</span>
            <div class="likert-options" role="radiogroup" aria-label="${(q.question || '').replace(/"/g, '&quot;')}">
              ${labels.join('')}
            </div>
            <span class="likert-right">${escapeHtml(qRight)}</span>
          </div>`;
      }
      return `
        <div class="exit-survey-block recall-survey-block-item" data-question-key="${escapeHtml(q.question_key)}" data-question-type="${isChoice ? 'choice' : 'likert'}">
          <p class="exit-survey-question">${escapeHtml(q.question)}</p>
          ${blockContent}
        </div>
      `;
    });

    const html = `
      <div class="recall-survey-page">
        ${recallHtml}
        <div class="recall-survey-questions">
          <h3 class="recall-survey-questions-title">From a scale of 1 to 7, how much do you agree with the following statements?</h3>
          ${surveyBlocks.join('')}
        </div>
        <div class="recall-survey-open-ended">
          <label for="recall-survey-additional-thoughts">Any additional thoughts you'd like to share? (optional)</label>
          <textarea id="recall-survey-additional-thoughts" class="recall-survey-additional-thoughts" rows="4" placeholder="Your response is optional."></textarea>
        </div>
        <div id="recall-survey-block-error" class="recall-survey-block-error hidden" role="alert"></div>
        <div class="recall-survey-actions">
          <button type="button" id="recall-survey-continue" class="jspsych-btn">Continue</button>
        </div>
      </div>
    `;
    display_element.innerHTML = html;
    const blockShownAt = Date.now();

    const continueBtn = display_element.querySelector('#recall-survey-continue');
    const errorEl = display_element.querySelector('#recall-survey-block-error');

    continueBtn.addEventListener('click', () => {
      const responses = questions.map((q) => {
        const block = display_element.querySelector(`.recall-survey-block-item[data-question-key="${q.question_key}"]`);
        const checked = block ? block.querySelector('input[type="radio"]:checked') : null;
        const isChoice = Array.isArray(q.options) && q.options.length > 0;
        const raw = checked ? checked.value : null;
        const survey_response = isChoice ? raw : (raw != null ? parseInt(raw, 10) : null);
        return { question_key: q.question_key, question: q.question, survey_response };
      });
      const missing = responses.filter((r) => r.survey_response == null);
      if (missing.length > 0) {
        errorEl.textContent = 'Please answer all questions before continuing.';
        errorEl.classList.remove('hidden');
        const firstBlock = display_element.querySelector(`.recall-survey-block-item[data-question-key="${missing[0].question_key}"]`);
        if (firstBlock) {
          const firstRadio = firstBlock.querySelector('input[type="radio"]');
          if (firstRadio) firstRadio.focus();
        }
        return;
      }
      errorEl.classList.add('hidden');
      const additionalThoughtsEl = display_element.querySelector('#recall-survey-additional-thoughts');
      const additional_thoughts = additionalThoughtsEl ? (additionalThoughtsEl.value || '').trim() : '';
      const rt = Math.round(performance.now() - t0);
      const blockCompletedAt = Date.now();
      this.jsPsych.finishTrial({
        trial_type: 'recall_survey_block',
        scenario_id: trial.scenario_id,
        domain: trial.domain,
        choice: trial.choice,
        violation_level: trial.violation_level,
        recalled_trial_id: trial.recalled_trial_id,
        survey_responses: responses,
        additional_thoughts: additional_thoughts || null,
        block_shown_at: blockShownAt,
        block_completed_at: blockCompletedAt,
        rt,
      });
    });
  }
}

RecallSurveyBlockPlugin.info = info;
export default RecallSurveyBlockPlugin;
