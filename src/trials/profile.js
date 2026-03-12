/**
 * User profiling: one Likert question per page (1–7).
 * Logs RT and response per question; profile_key used to group for score computation.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'profile_likert',
  parameters: {
    /** Key for grouping (e.g. "medical", "legal", "emotional", "recipient_trust"). */
    profile_key: {
      type: ParameterType.STRING,
      default: undefined,
    },
    /** Question text. TODO: Replace with your actual questions. */
    question: {
      type: ParameterType.STRING,
      default: undefined,
    },
    /** Left label for the scale */
    left_label: {
      type: ParameterType.STRING,
      default: 'Not acceptable',
    },
    /** Right label for the scale */
    right_label: {
      type: ParameterType.STRING,
      default: 'Very acceptable',
    },
    min: {
      type: ParameterType.INT,
      default: 1,
    },
    max: {
      type: ParameterType.INT,
      default: 7,
    },
  },
};

class ProfileLikertPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const t0 = performance.now();
    const range = trial.max - trial.min + 1;
    const options = Array.from({ length: range }, (_, i) => trial.min + i);
    const name = 'profile_likert_' + Math.random().toString(36).slice(2, 9);
    const labels = options.map(
      (v) =>
        `<label class="likert-option"><input type="radio" name="${name}" value="${v}" /> <span>${v}</span></label>`
    );
    const html = `
      <div class="profile-question-block">
        <p class="profile-question">${trial.question}</p>
        <div class="likert-labels">
          <span class="likert-left">${trial.left_label}</span>
          <div class="likert-options" role="radiogroup" aria-label="${trial.question.replace(/"/g, '&quot;')}">
            ${labels.join('')}
          </div>
          <span class="likert-right">${trial.right_label}</span>
        </div>
        <div class="form-actions">
          <button type="button" id="profile-next" class="jspsych-btn" disabled>Continue</button>
        </div>
      </div>
    `;
    display_element.innerHTML = html;

    const container = display_element.querySelector('.likert-options');
    const nextBtn = display_element.querySelector('#profile-next');
    const radios = display_element.querySelectorAll('input[type="radio"]');

    const finish = () => {
      const selected = display_element.querySelector(`input[name="${name}"]:checked`);
      const response = selected ? parseInt(selected.value, 10) : null;
      const rt = Math.round(performance.now() - t0);
      this.jsPsych.finishTrial({
        trial_type: 'profile_likert',
        profile_key: trial.profile_key,
        question: trial.question,
        response,
        rt,
      });
    };

    container.addEventListener('change', () => {
      nextBtn.disabled = false;
      nextBtn.focus();
    });
    nextBtn.addEventListener('click', finish);
    radios.forEach((r) => {
      r.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          r.checked = true;
          nextBtn.disabled = false;
          nextBtn.focus();
        }
      });
    });
  }
}

ProfileLikertPlugin.info = info;
export default ProfileLikertPlugin;
