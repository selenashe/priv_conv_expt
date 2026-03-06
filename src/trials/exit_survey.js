/**
 * Exit survey: one Likert question per page (1–7).
 * When used after a recall trial, log recalled_trial_id, recalled_domain, user_choice, violation_level, survey_question_id, survey_response.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'exit_survey_likert',
  parameters: {
    question_key: { type: ParameterType.STRING, default: undefined },
    question: { type: ParameterType.STRING, default: undefined },
    left_label: { type: ParameterType.STRING, default: 'Strongly disagree' },
    right_label: { type: ParameterType.STRING, default: 'Strongly agree' },
    min: { type: ParameterType.INT, default: 1 },
    max: { type: ParameterType.INT, default: 7 },
    recalled_trial_id: { type: ParameterType.INT, default: null },
    recalled_domain: { type: ParameterType.STRING, default: null },
    user_choice: { type: ParameterType.STRING, default: null },
    violation_level: { type: ParameterType.STRING, default: null },
  },
};

class ExitSurveyLikertPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const t0 = performance.now();
    const range = trial.max - trial.min + 1;
    const options = Array.from({ length: range }, (_, i) => trial.min + i);
    const name = 'exit_survey_' + Math.random().toString(36).slice(2, 9);
    const labels = options.map(
      (v) =>
        `<label class="likert-option"><input type="radio" name="${name}" value="${v}" /> <span>${v}</span></label>`
    );
    const html = `
      <div class="exit-survey-block">
        <p class="exit-survey-question">${trial.question}</p>
        <div class="likert-labels">
          <span class="likert-left">${trial.left_label}</span>
          <div class="likert-options" role="radiogroup" aria-label="${(trial.question || '').replace(/"/g, '&quot;')}">
            ${labels.join('')}
          </div>
          <span class="likert-right">${trial.right_label}</span>
        </div>
        <div class="form-actions">
          <button type="button" id="exit-survey-next" class="jspsych-btn" disabled>Continue</button>
        </div>
      </div>
    `;
    display_element.innerHTML = html;

    const nextBtn = display_element.querySelector('#exit-survey-next');
    const radios = display_element.querySelectorAll('input[type="radio"]');

    const finish = () => {
      const selected = display_element.querySelector(`input[name="${name}"]:checked`);
      const response = selected ? parseInt(selected.value, 10) : null;
      const rt = Math.round(performance.now() - t0);
      this.jsPsych.finishTrial({
        trial_type: 'exit_survey_likert',
        question_key: trial.question_key,
        question: trial.question,
        survey_question_id: trial.question_key,
        survey_response: response,
        response,
        rt,
        recalled_trial_id: trial.recalled_trial_id ?? null,
        recalled_domain: trial.recalled_domain ?? null,
        user_choice: trial.user_choice ?? null,
        violation_level: trial.violation_level ?? null,
      });
    };

    display_element.querySelector('.likert-options').addEventListener('change', () => {
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

ExitSurveyLikertPlugin.info = info;
export default ExitSurveyLikertPlugin;
