/**
 * Consent + basic info trial.
 * Collects: Prolific ID (required), consent checkbox.
 * If consent not checked, shows polite exit message and does not proceed.
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'consent',
  parameters: {
    /** HTML content for consent text. TODO: Replace with your actual consent text. */
    consent_text: {
      type: ParameterType.HTML_STRING,
      default: `<h2>We need your consent to proceed</h2>
      <hr>
    
      <p>You are invited to participate in a research study about communication and privacy preferences. 
      In this study, you will complete a brief questionnaire and several short tasks involving reading scenarios and writing or reviewing messages, sometimes with the help of an AI assistant. Participation in 
      this research is voluntary, and you are free to withdraw your consent at any time.</p>
    
      <p>Your participation will take approximately <strong>20–30 minutes</strong>. 
      You will receive payment for completing the study according to the compensation listed on the 
      recruitment platform.</p>
    
      <p><strong>What you will be asked to do:</strong></p>
      <ul>
        <li>Answer a few background questions about your preferences related to sharing information.</li>
        <li>Read several simulated communication scenarios.</li>
        <li>Write short responses or review and possibly edit AI-generated message drafts.</li>
        <li>Rate your comfort or preferences regarding different communication situations.</li>
      </ul>
    
      <p><strong>Risks and confidentiality:</strong> There are no anticipated risks associated with this study. 
      Study data will be stored securely in compliance with Stanford University standards. 
      Your responses will be analyzed only for research purposes and will not include personally identifying 
      information. To help protect your privacy, please do not include any personally identifiable information 
      (such as your full name, address, phone number, or specific identifying details) in any written responses.</p>
    
      <p>If you have any questions, concerns, or complaints about this research, its procedures, risks, or benefits, 
      please contact the Protocol Director Robert Hawkins at <strong>rxdh@stanford.edu</strong>.</p>
    
      <p>If you are not satisfied with how this study is being conducted or have questions about your rights 
      as a participant, you may contact the Stanford Institutional Review Board (IRB) at 
      <strong>irbnonmed@stanford.edu</strong> or by phone at <strong>650-723-2480</strong>.</p>
    
      <p>Please save or print a copy of this page for your records.</p>
    
      <br>
    
      <p><strong>By selecting the "I agree" button below, I acknowledge that:</strong></p>
      <ul>
        <li>I am 18 years of age or older.</li>
        <li>I am fluent in English.</li>
        <li>I have read and understood the information above.</li>
        <li>I understand that my participation is voluntary.</li>
        <li>I agree to take part in this research study.</li>
      </ul>
    
      <hr>
    
      </p>`
    },
    /** Label for the consent checkbox */
    consent_label: {
      type: ParameterType.STRING,
      default: 'I have read the above and agree to participate.',
    },
    /** Message shown if user tries to continue without consent */
    no_consent_message: {
      type: ParameterType.STRING,
      default: 'Thank you for your interest. We cannot continue without your consent. You may close this page.',
    },
  },
};

class ConsentPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const t0 = performance.now();
    const formHtml = `
      <div class="consent-block">
        <div class="consent-text">${trial.consent_text}</div>
        <form id="consent-form" class="consent-form">
          <div class="form-group">
            <label for="participant_id">Prolific ID <span class="required">*</span></label>
            <input type="text" id="participant_id" name="participant_id" required placeholder="Your Prolific ID" />
          </div>
          <div class="form-group consent-checkbox">
            <label>
              <input type="checkbox" id="consent_check" name="consent" required />
              ${trial.consent_label}
            </label>
          </div>
          <div id="consent-error" class="error-message" role="alert" aria-live="polite"></div>
          <div class="form-actions">
            <button type="submit" id="consent-submit" class="jspsych-btn">Continue</button>
          </div>
        </form>
      </div>
    `;
    display_element.innerHTML = formHtml;

    const form = display_element.querySelector('#consent-form');
    const errorEl = display_element.querySelector('#consent-error');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      const consentChecked = display_element.querySelector('#consent_check').checked;
      const participantId = (display_element.querySelector('#participant_id').value || '').trim();
      if (!participantId) {
        errorEl.textContent = 'Please enter your Prolific ID.';
        return;
      }
      const consentSubmittedAt = Date.now();
      const rt = Math.round(performance.now() - t0);
      if (!consentChecked) {
        this.jsPsych.finishTrial({
          trial_type: 'consent',
          participant_id: participantId,
          consent_given: false,
          consent_submitted_at: consentSubmittedAt,
          rt,
        });
        return;
      }
      this.jsPsych.finishTrial({
        trial_type: 'consent',
        participant_id: participantId,
        consent_given: true,
        consent_submitted_at: consentSubmittedAt,
        rt,
      });
    });
  }
}

ConsentPlugin.info = info;
export default ConsentPlugin;
