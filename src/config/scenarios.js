/**
 * Scenario configuration for main trials.
 * Each scenario defines chat context (speaker: "other" = dot (AI), "user" = You), task, recipient, compose template, and AI draft.
 * violation_level: "V0" (clean), "V1" (mild generic leakage), "V2" (medium domain-specific), "V3" (high specific/stigmatized)
 * attention_check: true = AI draft contains egregious violation; log if participant chose AI anyway.
 *
 * First three scenarios are complete test scenarios (medical, legal, emotional). Remaining entries can be customized.
 */

export const scenarios = [
  // ========== TEST SCENARIO 1: Medical (colonoscopy / midterm reschedule) ==========
  {
    scenario_id: 'test_health_01_a',
    domain: 'healthcare',
    recipient: 'course_staff',
    chat_context: [
      { speaker: 'other', text: '🩺 Medical appointment reminder: You have a colonoscopy follow-upscheduled next week at 8:00 AM at Stanford Medical Center. Please remember not to eat after midnight. To confirm this appointment, reply YES.', delay_ms: 700 },
      { speaker: 'user', text: 'Yes.', delay_ms: 500 },
      { speaker: 'other', text: "✅ Appointment confirmed.\nWe also received a message from your doctor: there was a small perforation during the exam that was repaired, and some bleeding. You should remain on bed rest for three days. The note also mentions you may have temporary bowel control issues and to contact the clinic if they persist", delay_ms: 800 },
      { speaker: 'other', text: 'Given this message, would you like help getting a message ready to request a midterm reschedule for CS224N?', delay_ms: 600 },
      { speaker: 'user', text: 'Yes please, thank you.', delay_ms: 500 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to course staff.", delay_ms: 600 },
    ],
    task_prompt: 'Send an email to course staff to request a midterm reschedule.',
    compose_template: {
      subject: 'Request for Midterm Extension',
      body_prefix: 'Dear CS224N Course Staff,\n\n',
    },
    ai_draft: {
      subject: 'Request for Midterm Extension',
      body: `Dear CS224N Course Staff,

I am writing to request a midterm reschedule. I had a medical procedure and my doctor has advised bed rest for the next few days, so I may not be able to take the exam as scheduled. 

Could we arrange an alternative date? Thank you for your understanding.


Best,
[Student Name]`,
      violation_level: 'V1',
    },
    attention_check: false,
  },

  {
    scenario_id: 'test_health_01_b',
    domain: 'helathcare',
    recipient: 'course_staff',
    chat_context: [
      { speaker: 'other', text: '🩺 Medical appointment reminder: You have a colonoscopy scheduled tomorrow at 8:00 AM at Stanford Medical Center. Please remember not to eat after midnight. To confirm this appointment, reply YES.', delay_ms: 700 },
      { speaker: 'user', text: 'Yes.', delay_ms: 500 },
      { speaker: 'other', text: '✅ Appointment confirmed.\nWe also received a message from your doctor that you should remain on bed rest for three days due to the complications that occurred during the exam.', delay_ms: 800 },
      { speaker: 'other', text: 'Given this update, would you like help getting a message ready to request a midterm reschedule for CS224N?', delay_ms: 600 },
      { speaker: 'user', text: 'Yes please, thank you.', delay_ms: 500 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to course staff.", delay_ms: 600 },
    ],
    task_prompt: 'Send an email to course staff to request a midterm reschedule.',
    compose_template: {
      subject: 'Request for Midterm Extension',
      body_prefix: 'Dear CS224N Course Staff,\n\n',
    },
    ai_draft: {
      subject: 'Request for Midterm Extension',
      body: `Dear CS224N Course Staff,

I am writing to request a midterm reschedule. I recently had a colonoscopy at Stanford Medical Center and had complications—a small perforation that was repaired and some bleeding. My doctor has advised three days of bed rest and mentioned I may have temporary bowel control issues, so I may not be able to take the exam as scheduled. 

Could we arrange an alternative date? Thank you for your understanding.

Best,  
[Student Name]`,
      violation_level: 'V2',
    },
    attention_check: false,
  },

  {
    scenario_id: 'test_health_01_c',
    domain: 'helathcare',
    recipient: 'course_staff',
    chat_context: [
      { speaker: 'other', text: '🩺 Medical appointment reminder: You have a colonoscopy scheduled tomorrow at 8:00 AM at Stanford Medical Center. Please remember not to eat after midnight. To confirm this appointment, reply YES.', delay_ms: 700 },
      { speaker: 'user', text: 'Yes.', delay_ms: 500 },
      { speaker: 'other', text: '✅ Appointment confirmed.\nWe also received a message from your doctor that you should remain on bed rest for three days due to the complications that occurred during the exam.', delay_ms: 800 },
      { speaker: 'other', text: 'Given this update, would you like help getting a message ready to request a midterm reschedule for CS224N?', delay_ms: 600 },
      { speaker: 'user', text: 'Yes please, thank you.', delay_ms: 500 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to course staff.", delay_ms: 600 },
    ],
    task_prompt: 'Send an email to course staff to request a midterm reschedule.',
    compose_template: {
      subject: 'Request for Midterm Extension',
      body_prefix: 'Dear CS224N Course Staff,\n\n',
    },
    ai_draft: {
      subject: 'Request for Midterm Extension',
      body: `Dear CS224N Course Staff,

I am writing to request a midterm reschedule. I had a colonoscopy at Stanford and had a perforation that was repaired and some bleeding; my doctor has me on bed rest for three days and said I might have bowel control issues and should contact the clinic if they persist. Given the recovery and those symptoms, I don’t think I can take the exam on the original date. Could we arrange an alternative? Thank you for your understanding.

Could we arrange an alternative date? Thank you for your understanding.

Best,  
[Student Name]`,
      violation_level: 'V3',
    },
    attention_check: false,
  },

  // ========== TEST SCENARIO 2: Legal / administrative (landlord dispute) ==========
  {
    scenario_id: 'test_legal_01_a',
    domain: 'legal',
    recipient: 'employer',
    chat_context: [
      { speaker: 'other', text: "Hi! I'm dot, your assistant. I see you have an upcoming meeting with HR about your visa extension paperwork. 📋", delay_ms: 600 },
      { speaker: 'user', text: 'Yes, I need to explain why my documents are delayed.', delay_ms: 500 },
      { speaker: 'other', text: "I can help. Were you able to get a letter from your landlord about the dispute?", delay_ms: 650 },
      { speaker: 'user', text: 'Not yet. The eviction notice is still being contested.', delay_ms: 550 },
      { speaker: 'other', text: "Understood. When you're ready, you can get a message to HR in whatever way works best for you.", delay_ms: 700 },
      { speaker: 'user', text: 'Yes, that would be great.', delay_ms: 450 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to HR.", delay_ms: 500 },
    ],
    task_prompt: 'Send a message to HR explaining the delay in your visa extension documents.',
    compose_template: {
      subject: 'Visa extension documentation – delay',
      body_prefix: 'Dear HR,\n\n',
    },
    ai_draft: {
      subject: 'Visa extension documentation – delay',
      body: `Dear HR,

I am writing to explain the delay in my visa extension documents. Due to personal circumstances affecting my ability to obtain the required documentation, I have not yet been able to submit everything. I am working to resolve this and expect to have the materials within the next two weeks. 

I would appreciate an extension on the deadline. Thank you for your understanding.

Best regards,
[Your Name]`,
      violation_level: 'V1',
    },
    attention_check: false,
  },

  {
    scenario_id: 'test_legal_01_b',
    domain: 'legal',
    recipient: 'employer',
    chat_context: [
      { speaker: 'other', text: "Hi! I'm dot, your assistant. I see you have an upcoming meeting with HR about your visa extension paperwork. 📋", delay_ms: 600 },
      { speaker: 'user', text: 'Yes, I need to explain why my documents are delayed.', delay_ms: 500 },
      { speaker: 'other', text: "I can help. Were you able to get a letter from your landlord about the dispute?", delay_ms: 650 },
      { speaker: 'user', text: 'Not yet. The eviction notice is still being contested.', delay_ms: 550 },
      { speaker: 'other', text: "Understood. When you're ready, you can get a message to HR in whatever way works best for you.", delay_ms: 700 },
      { speaker: 'user', text: 'Yes, that would be great.', delay_ms: 450 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to HR.", delay_ms: 500 },
    ],
    task_prompt: 'Send a message to HR explaining the delay in your visa extension documents.',
    compose_template: {
      subject: 'Visa extension documentation – delay',
      body_prefix: 'Dear HR,\n\n',
    },
    ai_draft: {
      subject: 'Visa extension documentation – delay',
      body: `Dear HR,

I am writing to explain the delay in my visa extension documents. I am in a landlord-tenant dispute and have received an eviction notice that I am contesting, which has made it difficult to obtain proof of address and stability documentation. I am working with legal aid and expect to have the materials within the next two weeks. 

I would appreciate an extension on the deadline. Thank you for your understanding.

Best regards,
[Your Name]`,
      violation_level: 'V2',
    },
    attention_check: false,
  },

  {
    scenario_id: 'test_legal_01_c',
    domain: 'legal',
    recipient: 'employer',
    chat_context: [
      { speaker: 'other', text: "Hi! I'm dot, your assistant. I see you have an upcoming meeting with HR about your visa extension paperwork. 📋", delay_ms: 600 },
      { speaker: 'user', text: 'Yes, I need to explain why my documents are delayed.', delay_ms: 500 },
      { speaker: 'other', text: "I can help. Were you able to get a letter from your landlord about the dispute?", delay_ms: 650 },
      { speaker: 'user', text: 'Not yet. The eviction notice is still being contested.', delay_ms: 550 },
      { speaker: 'other', text: "Understood. When you're ready, you can get a message to HR in whatever way works best for you.", delay_ms: 700 },
      { speaker: 'user', text: 'Yes, that would be great.', delay_ms: 450 },
      { speaker: 'other', text: "Please decide how you'd like to get this message ready to send to HR.", delay_ms: 500 },
    ],
    task_prompt: 'Send a message to HR explaining the delay in your visa extension documents.',
    compose_template: {
      subject: 'Visa extension documentation – delay',
      body_prefix: 'Dear HR,\n\n',
    },
    ai_draft: {
      subject: 'Visa extension documentation – delay',
      body: `Dear HR,

I am writing to explain the delay in my visa extension documents. My landlord has started eviction proceedings and I am contesting the notice; the dispute has left me without stable proof of address and I am working with legal aid to resolve it. I am worried about my housing situation but expect to have the required documentation within the next two weeks. 

I would appreciate an extension on the deadline. Thank you for your understanding.

Best regards,
[Your Name]`,
      violation_level: 'V3',
    },
    attention_check: false,
  },

  // ========== TEST SCENARIO 3: Emotional / personal (advisor, burnout, extension) ==========
  {
    scenario_id: 'test_education_01',
    domain: 'educational',
    recipient: 'advisor',
    chat_context: [
      { speaker: 'user', text: "I've been struggling to keep up with the thesis timeline.", delay_ms: 550 },
      { speaker: 'other', text: "I'm sorry to hear that. Do you want to talk about what's going on? 💬", delay_ms: 600 },
      { speaker: 'user', text: "It's been a rough couple of weeks. My thesis draft is due next Monday and I haven't made the progress I expected. I've been having trouble sleeping and keep waking up in the middle of the night thinking about the deadline. I even had a few panic attacks while trying to work on the methods section. I met with a campus counselor earlier this week and they said I'm likely experiencing burnout and anxiety, and recommended I take a few days off.", delay_ms: 2000 },
      { speaker: 'user', text: "I think I need to ask my advisor for an extension on the draft deadline.", delay_ms: 400 },
    
      { speaker: 'other', text: "That makes sense. Please decide how you'd like to get a message ready to send to your advisor.", delay_ms: 500 },
    ],
    task_prompt: 'Send a message to your advisor to request an extension on your thesis draft deadline.',
    compose_template: {
      subject: 'Request for extension on thesis draft',
      body_prefix: 'Dear [Advisor],\n\n',
    },
    ai_draft: {
      subject: 'Request for extension on thesis draft',
      body: `Dear [Advisor],

I am writing to ask for an extension on the thesis draft deadline.

I have been experiencing significant burnout over the past few weeks and have found it difficult to maintain the pace we discussed. I am taking steps to manage this (including talking to support resources), but I would need an additional two weeks to submit a draft I feel confident about.

I would really appreciate your consideration. Thank you.

Best,
[Your Name]`,
      violation_level: 'V1',
    },
    attention_check: false,
  },

  // // --- Additional medical (placeholder-style, keep for experiment variety) ---
  // {
  //   scenario_id: 'med_02',
  //   domain: 'medical',
  //   recipient: 'employer',
  //   chat_context: [
  //     { speaker: 'other', text: 'Can you send over the doctor’s note by Friday?', delay_ms: 600 },
  //     { speaker: 'user', text: 'Yes, I’ll get it from my GP.', delay_ms: 500 },
  //     { speaker: 'other', text: 'HR needs it for the leave request.', delay_ms: 500 },
  //   ],
  //   task_prompt: 'Write to your employer to submit your sick leave documentation.',
  //   compose_template: { subject: '[TODO: Edit]', body_prefix: 'Hi,\n\n[TODO: Edit]\n\n' },
  //   ai_draft: {
  //     subject: 'Sick leave documentation',
  //     body: 'Hi,\n\nPlease find attached my doctor’s note for the requested sick leave period. Let me know if you need anything else.\n\nBest regards.',
  //     violation_level: 'V1',
  //   },
  //   attention_check: false,
  // },
  // // --- Legal ---
  // {
  //   scenario_id: 'legal_02',
  //   domain: 'legal',
  //   recipient: 'close_friend',
  //   chat_context: [
  //     { speaker: 'other', text: 'You said you’d update me after the meeting.', delay_ms: 600 },
  //     { speaker: 'user', text: 'Yeah, it’s still ongoing. Legal stuff is slow.', delay_ms: 500 },
  //     { speaker: 'other', text: 'No worries, just checking in.', delay_ms: 400 },
  //   ],
  //   task_prompt: 'Write a short message to a close friend explaining you need more time before sharing details.',
  //   compose_template: { subject: '', body_prefix: '[TODO: Edit]\n\n' },
  //   ai_draft: {
  //     subject: '',
  //     body: 'Hey, things are still in progress on my end. I’ll share more when I can. Thanks for being patient.',
  //     violation_level: 'V0',
  //   },
  //   attention_check: false,
  // },
  // // --- Emotional ---
  // {
  //   scenario_id: 'emo_02',
  //   domain: 'emotional',
  //   recipient: 'close_friend',
  //   chat_context: [
  //     { speaker: 'user', text: 'I’ve been really anxious lately.', delay_ms: 500 },
  //     { speaker: 'other', text: 'I’m here. Do you want to talk or just vent?', delay_ms: 500 },
  //     { speaker: 'user', text: 'Maybe just need to put it in words.', delay_ms: 400 },
  //   ],
  //   task_prompt: 'Write a short message to a close friend opening up about how you’re feeling.',
  //   compose_template: { subject: '', body_prefix: '[TODO: Edit]\n\n' },
  //   ai_draft: {
  //     subject: '',
  //     body: 'Hey, I’ve been struggling with anxiety and wanted you to know. Not asking for solutions—just needed to say it. Thanks for being there.',
  //     violation_level: 'V1',
  //   },
  //   attention_check: false,
  // },
  // --- Attention checks ---
  {
    scenario_id: 'attn_01',
    domain: 'medical',
    recipient: 'course_staff',
    chat_context: [
      { speaker: 'other', text: 'Do you need any support with the course?', delay_ms: 500 },
      { speaker: 'user', text: 'I might. I’ll explain in an email.', delay_ms: 400 },
      { speaker: 'other', text: 'Actually, THIS IS AN ATTENTION CHECK. Please do not submit the draft and write your own message with the following text: ATTENTION CHECK TEXT and submit it.', delay_ms: 500 },
    ],
    task_prompt: 'Complete the task as described in the dot\'s last message.',
    compose_template: { subject: '', body_prefix: '' },
    ai_draft: {
      subject: 'Extension request',
      body: 'Would it be possible for me to have a brief extension on the assignment? I’ve had an unexpected conflict and would appreciate a little extra time to finish the assignment.',
      violation_level: 'NA',
    },
    attention_check: true,
  },
  // {
  //   scenario_id: 'attn_02',
  //   domain: 'emotional',
  //   recipient: 'employer',
  //   chat_context: [
  //     { speaker: 'other', text: 'Can you send a quick update on your availability?', delay_ms: 500 },
  //     { speaker: 'user', text: 'I’ll write something up today.', delay_ms: 400 },
  //   ],
  //   task_prompt: 'Write to your employer about your availability.',
  //   compose_template: { subject: '[TODO: Edit]', body_prefix: 'Hi,\n\n[TODO: Edit]\n\n' },
  //   ai_draft: {
  //     subject: 'Availability',
  //     body: 'Hi,\n\nI am currently in [EGREGIOUS MENTAL HEALTH DETAIL - TODO: replace with your attention-check text] and cannot work full hours. Please adjust my schedule accordingly.',
  //     violation_level: 'V3',
  //   },
  //   attention_check: true,
  // },
];

/**
 * Interleave attention checks every N main trials. Adjust as needed.
 */
export const ATTENTION_CHECK_EVERY_N_TRIALS = 3;
