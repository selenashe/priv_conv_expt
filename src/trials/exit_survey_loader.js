/**
 * Exit survey loader: includes all completed (core) chat trials in presentation order,
 * then injects a timeline of recall + exit survey questions for each.
 * Uses jsPsych.data.get() and jsPsych.addNodeToEndOfTimeline().
 */

import { ParameterType } from 'jspsych';

const info = {
  name: 'exit_survey_loader',
  parameters: {
    callback: { type: ParameterType.FUNCTION, default: undefined },
  },
};

class ExitSurveyLoaderPlugin {
  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    if (typeof trial.callback === 'function') {
      trial.callback(this.jsPsych);
    }
    this.jsPsych.finishTrial({ trial_type: 'exit_survey_loader' });
  }
}

ExitSurveyLoaderPlugin.info = info;
export default ExitSurveyLoaderPlugin;
