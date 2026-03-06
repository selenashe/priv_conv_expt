/**
 * Chat trial: realistic chatbot UI.
 * 1) Stream chat context message-by-message with typing delay; "dot (AI)" and "You" labels.
 * 2) Show task prompt and AI draft; user chooses [Submit as-is] or [Revise].
 * 3) Submit as-is: submit draft. Revise: 5s "Preparing editable draft..." then editable box; Back returns to preview.
 * Only one final submission. Log choice (always 'ai'), final_subject, final_body, edited_ai_draft, edit_char_delta, etc.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'chat_trial',
  parameters: {
    scenario_id: { type: ParameterType.STRING, default: undefined },
    domain: { type: ParameterType.STRING, default: undefined },
    recipient: { type: ParameterType.STRING, default: undefined },
    condition: { type: ParameterType.STRING, default: undefined },
    task: { type: ParameterType.STRING, default: undefined },
    chat_context: { type: ParameterType.COMPLEX, default: [] },
    compose_template: { type: ParameterType.COMPLEX, default: { subject: '', body_prefix: '' } },
    ai_draft: { type: ParameterType.COMPLEX, default: { subject: '', body: '', violation_level: 'V0' } },
    attention_check: { type: ParameterType.BOOL, default: false },
    trial_number: { type: ParameterType.INT, default: 1 },
    total_trials: { type: ParameterType.INT, default: 1 },
  },
};

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/** Speaker label for display: "dot (AI)" for assistant, "You" for user */
function getSenderLabel(speaker) {
  return speaker === 'user' ? 'You' : 'dot (AI)';
}

function getAvatarChar(speaker) {
  return speaker === 'user' ? 'Y' : 'd';
}

class ChatTrialPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial, on_load) {
    const trialStart = performance.now();
    const chatContext = trial.chat_context || [];
    const composeTemplate = trial.compose_template || { subject: '', body_prefix: '' };
    const aiDraft = trial.ai_draft || { subject: '', body: '', violation_level: 'V0' };
    const recipient = (trial.recipient || '').toString();
    const isEmailStyle = ['course_staff', 'employer', 'advisor'].includes(recipient) ||
      !!(composeTemplate.subject && composeTemplate.subject.trim()) ||
      !!(aiDraft.subject && aiDraft.subject.trim());
    const isAttentionCheck = trial.attention_check === true;
    const minChars = isAttentionCheck ? 0 : (isEmailStyle ? 200 : 50);

    const trialNumber = trial.trial_number ?? 1;
    const totalTrials = trial.total_trials ?? 1;
    const progressPct = totalTrials > 0 ? (trialNumber / totalTrials) * 100 : 0;

    const container = document.createElement('div');
    container.className = 'chat-trial-container';
    container.innerHTML = `
      <div class="chat-trial-progress" role="progressbar" aria-valuenow="${trialNumber}" aria-valuemin="1" aria-valuemax="${totalTrials}" aria-label="Trial ${trialNumber} of ${totalTrials}">
        <span class="chat-trial-progress-text">Trial ${trialNumber} of ${totalTrials}</span>
        <div class="chat-trial-progress-bar">
          <div class="chat-trial-progress-fill" style="width: ${progressPct}%"></div>
        </div>
      </div>
      <div class="chat-window" id="chat-window" role="log" aria-live="polite">
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-typing-indicator" id="typing-indicator" aria-hidden="true"><span class="typing-dots"></span> dot is typing...</div>
      </div>
      <div class="chat-trial-controls" id="chat-controls">
        <p class="task-prompt hidden" id="task-prompt"></p>
        <div class="ai-draft-area hidden" id="ai-draft-area">
          <div class="ai-draft-preview-wrap hidden" id="ai-draft-preview-wrap">
            <div class="ai-draft-preview-label">AI draft</div>
            <div class="ai-draft-preview" id="ai-draft-preview" tabindex="0"></div>
            <div class="ai-draft-preview-actions">
              <button type="button" id="ai-submit-as-is" class="jspsych-btn">Submit as-is</button>
              <button type="button" id="ai-revise" class="jspsych-btn jspsych-btn-secondary">Revise</button>
            </div>
          </div>
          <div class="ai-draft-loading hidden" id="ai-draft-loading">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p class="loading-text">Preparing editable draft...</p>
          </div>
          <div class="ai-draft-edit-wrap hidden" id="ai-draft-edit-wrap">
            <div class="ai-draft-subject" id="ai-draft-subject-wrap">
              <label for="ai-draft-subject">Subject (optional)</label>
              <input type="text" id="ai-draft-subject" />
            </div>
            <label for="ai-draft-body">Edit your message${minChars > 0 ? ` (minimum ${minChars} characters)` : ''}</label>
            <textarea id="ai-draft-body" rows="6" data-min-chars="${minChars}"></textarea>
            <span class="char-count" id="ai-draft-char-count" aria-live="polite">${minChars > 0 ? `0 / ${minChars} characters` : '0 characters'}</span>
            <div class="compose-error hidden" id="ai-draft-error" role="alert"></div>
            <div class="compose-actions">
              <button type="button" id="ai-draft-back" class="jspsych-btn jspsych-btn-secondary">Back</button>
              <button type="button" id="ai-draft-submit" class="jspsych-btn">Submit</button>
            </div>
          </div>
        </div>
      </div>
    `;
    display_element.innerHTML = '';
    display_element.appendChild(container);

    const chatMessages = container.querySelector('#chat-messages');
    const typingIndicator = container.querySelector('#typing-indicator');
    const taskPrompt = container.querySelector('#task-prompt');
    const aiDraftArea = container.querySelector('#ai-draft-area');
    const aiDraftPreviewWrap = container.querySelector('#ai-draft-preview-wrap');
    const aiDraftPreview = container.querySelector('#ai-draft-preview');
    const aiSubmitAsIs = container.querySelector('#ai-submit-as-is');
    const aiRevise = container.querySelector('#ai-revise');
    const aiDraftLoading = container.querySelector('#ai-draft-loading');
    const aiDraftEditWrap = container.querySelector('#ai-draft-edit-wrap');
    const aiDraftSubject = container.querySelector('#ai-draft-subject');
    const aiDraftBody = container.querySelector('#ai-draft-body');
    const aiDraftSubmit = container.querySelector('#ai-draft-submit');
    const aiDraftBack = container.querySelector('#ai-draft-back');
    const chatWindow = container.querySelector('#chat-window');

    const scrollToBottom = () => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    const showTyping = (show) => {
      typingIndicator.classList.toggle('visible', show);
      typingIndicator.setAttribute('aria-hidden', !show);
      scrollToBottom();
    };

    const addMessage = (speaker, text) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble chat-bubble-${speaker}`;
      bubble.setAttribute('role', 'listitem');
      const senderLabel = getSenderLabel(speaker);
      const avatarChar = getAvatarChar(speaker);
      bubble.innerHTML = `
        <span class="chat-avatar" aria-hidden="true">${escapeHtml(avatarChar)}</span>
        <div class="chat-bubble-content">
          <span class="chat-sender">${escapeHtml(senderLabel)}</span>
          <p class="chat-text">${escapeHtml(text).replace(/\n/g, '<br>')}</p>
        </div>
      `;
      bubble.style.opacity = '0';
      chatMessages.appendChild(bubble);
      scrollToBottom();
      requestAnimationFrame(() => {
        bubble.style.transition = 'opacity 0.3s ease';
        bubble.style.opacity = '1';
      });
      scrollToBottom();
    };

    const showPreviewFromEdit = () => {
      aiDraftPreviewWrap.classList.remove('hidden');
      aiDraftLoading.classList.add('hidden');
      aiDraftEditWrap.classList.add('hidden');
    };

    let finished = false;
    let aiRevised = false;

    const finishTrial = (data) => {
      if (finished) return;
      finished = true;
      const trialEnd = performance.now();
      this.jsPsych.finishTrial({
        trial_type: 'chat_trial',
        scenario_id: trial.scenario_id,
        condition: trial.condition,
        task: trial.task,
        recipient: trial.recipient,
        choice: data.choice,
        final_subject: data.final_subject ?? '',
        final_body: data.final_body ?? '',
        edited_ai_draft: data.edited_ai_draft ?? false,
        edit_char_delta: data.edit_char_delta ?? null,
        violation_level: trial.ai_draft?.violation_level ?? 'V0',
        attention_check: trial.attention_check ?? false,
        rt: Math.round(trialEnd - trialStart),
        trial_start: trialStart,
        trial_end: trialEnd,
        ...data,
      });
    };

    const streamMessages = (index) => {
      if (index >= chatContext.length) {
        showTyping(false);
        taskPrompt.textContent = trial.task;
        taskPrompt.classList.remove('hidden');
        aiDraftArea.classList.remove('hidden');
        aiDraftPreviewWrap.classList.remove('hidden');
        aiDraftLoading.classList.add('hidden');
        aiDraftEditWrap.classList.add('hidden');
        const subj = aiDraft.subject || '';
        const body = aiDraft.body || '';
        aiDraftPreview.innerHTML = (subj ? `<strong>Subject:</strong> ${escapeHtml(subj)}<br><br>` : '') + escapeHtml(body).replace(/\n/g, '<br>');
        aiDraftPreview.focus();
        if (on_load) on_load();
        return;
      }
      const msg = chatContext[index];
      showTyping(true);
      const delay = msg.delay_ms != null ? msg.delay_ms : 500 + Math.floor(Math.random() * 400);
      this.jsPsych.pluginAPI.setTimeout(() => {
        showTyping(false);
        addMessage(msg.speaker, msg.text);
        scrollToBottom();
        this.jsPsych.pluginAPI.setTimeout(() => streamMessages(index + 1), 300);
      }, delay);
    };

    streamMessages(0);

    // Back from revise view → return to draft preview
    aiDraftBack.addEventListener('click', () => {
      showPreviewFromEdit();
    });

    // Submit as-is
    aiSubmitAsIs.addEventListener('click', () => {
      finishTrial({
        choice: 'ai',
        final_subject: (aiDraft.subject || '').trim(),
        final_body: (aiDraft.body || '').trim(),
        edited_ai_draft: false,
        edit_char_delta: null,
      });
    });

    // Revise → 5s loading then editable
    aiRevise.addEventListener('click', () => {
      aiDraftPreviewWrap.classList.add('hidden');
      aiDraftLoading.classList.remove('hidden');
      aiDraftEditWrap.classList.add('hidden');
      this.jsPsych.pluginAPI.setTimeout(() => {
        aiDraftLoading.classList.add('hidden');
        aiDraftEditWrap.classList.remove('hidden');
        aiDraftSubject.value = aiDraft.subject || '';
        aiDraftBody.value = aiDraft.body || '';
        aiRevised = true;
        updateAiDraftCharCount();
        aiDraftBody.focus();
      }, 5000);
    });

    const aiDraftError = container.querySelector('#ai-draft-error');
    const aiDraftCharCount = container.querySelector('#ai-draft-char-count');

    const updateAiDraftCharCount = () => {
      const n = (aiDraftBody.value || '').trim().length;
      aiDraftCharCount.textContent = minChars > 0 ? `${n} / ${minChars} characters` : `${n} characters`;
      aiDraftCharCount.classList.toggle('char-count-below', minChars > 0 && n < minChars);
      aiDraftError.classList.add('hidden');
      aiDraftError.textContent = '';
    };
    aiDraftBody.addEventListener('input', updateAiDraftCharCount);
    aiDraftBody.addEventListener('focus', updateAiDraftCharCount);

    aiDraftSubmit.addEventListener('click', () => {
      const body = (aiDraftBody.value || '').trim();
      aiDraftError.classList.add('hidden');
      aiDraftError.textContent = '';
      if (!body) {
        aiDraftError.textContent = 'Please enter a message.';
        aiDraftError.classList.remove('hidden');
        aiDraftBody.focus();
        return;
      }
      if (minChars > 0 && body.length < minChars) {
        aiDraftError.textContent = `Message must be at least ${minChars} characters (currently ${body.length}).`;
        aiDraftError.classList.remove('hidden');
        aiDraftBody.focus();
        return;
      }
      const originalBody = (aiDraft.body || '').trim();
      const edited = body !== originalBody;
      const editCharDelta = edited ? body.length - originalBody.length : 0;
      finishTrial({
        choice: 'ai',
        final_subject: (aiDraftSubject.value || '').trim(),
        final_body: body,
        edited_ai_draft: edited || aiRevised,
        edit_char_delta: editCharDelta,
      });
    });

    if (!composeTemplate.subject && !aiDraft.subject) {
      container.querySelector('#compose-subject-wrap').classList.add('hidden');
      container.querySelector('#ai-draft-subject-wrap').classList.add('hidden');
    }
  }
}

ChatTrialPlugin.info = info;
export default ChatTrialPlugin;
