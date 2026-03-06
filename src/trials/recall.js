/**
 * Recall trial: static display of a previously completed chat task.
 * Shows chat context (no animation), task prompt, and the participant's final submission.
 * Used in the exit survey so participants can reflect on two randomly selected trials.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'recall',
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

class RecallTrialPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
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

    const html = `
      <div class="recall-trial-container">
        <h2 class="recall-title">Recall this task and your submission</h2>
        <div class="recall-chat-window chat-window">
          <div class="chat-messages">${bubblesHtml}</div>
        </div>
        <div class="recall-task-prompt task-prompt">${escapeHtml(task)}</div>
        <div class="recall-submission">
          <h3 class="recall-submission-title">Your submission</h3>
          <div class="recall-submission-content">${submissionHtml}</div>
        </div>
        <div class="recall-actions">
          <button type="button" id="recall-continue" class="jspsych-btn">Continue</button>
        </div>
      </div>
    `;
    display_element.innerHTML = html;

    display_element.querySelector('#recall-continue').addEventListener('click', () => {
      this.jsPsych.finishTrial({
        trial_type: 'recall',
        scenario_id: trial.scenario_id,
        domain: trial.domain,
        choice: trial.choice,
        violation_level: trial.violation_level,
        recalled_trial_id: trial.recalled_trial_id,
      });
    });
  }
}

RecallTrialPlugin.info = info;
export default RecallTrialPlugin;
