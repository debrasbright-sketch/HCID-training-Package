/* ============================================
   HCID Training Guide — Interactive Features
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCollapsibles();
  initQuizzes();
  initVideoTracking();
  initCertificateSystem();
  initProgress();
  initScrollSpy();
  initMobileMenu();
  initDoctorScenarios();
  initPathogenSorter();
});

/* --- Navigation --- */
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileMenu();
      }
    });
  });
}

/* --- Scroll Spy --- */
function initScrollSpy() {
  const sections = document.querySelectorAll('.module-section');
  const navItems = document.querySelectorAll('.nav-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(n => n.classList.remove('active'));
        const active = document.querySelector(`.nav-item[href="#${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* --- Collapsible Sections --- */
function initCollapsibles() {
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      parent.classList.toggle('open');
    });
  });
}

/* --- Quiz & Assessment System (80% Pass Mark) --- */
function initQuizzes() {
  loadSavedQuizAnswers();

  document.querySelectorAll('.quiz-options li').forEach(option => {
    option.addEventListener('click', () => {
      const question = option.closest('.quiz-question');
      const qId = question.dataset.qid;
      const allOpts = question.querySelectorAll('.quiz-options li');
      const feedback = question.querySelector('.quiz-feedback');

      // Prevent re-answering once locked
      if (question.classList.contains('answered')) return;
      question.classList.add('answered');

      const isCorrect = option.dataset.correct === 'true';
      const optionIndex = Array.from(allOpts).indexOf(option);
      option.classList.add('selected');

      if (isCorrect) {
        option.classList.add('correct');
        feedback.className = 'quiz-feedback show correct';
        feedback.textContent = '✓ Correct! ' + (option.dataset.explanation || '');
      } else {
        option.classList.add('incorrect');
        allOpts.forEach(o => { if (o.dataset.correct === 'true') o.classList.add('correct'); });
        feedback.className = 'quiz-feedback show incorrect';
        feedback.textContent = '✗ Incorrect. ' + (option.dataset.explanation || 'See the correct answer highlighted in green.');
      }

      saveQuizAnswer(qId, optionIndex, isCorrect);
      calculateAssessmentScore();
      updateSimDashboardDots();

      // Check module completion readiness for the module containing this question
      const section = question.closest('.module-section');
      if (section) {
        evaluateModuleReadiness(section.id);
      }
    });
  });

  const resetBtn = document.getElementById('reset-assessment-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const isCy = document.documentElement.lang === 'cy';
      if (confirm(isCy ? 'A ydych chi\'n siŵr eich bod am ailosod yr holl atebion cwis, fideos a wyliwyd, a\'r ymarfer sortio ac ailddechrau\'r asesiad?' : 'Are you sure you want to reset all quiz answers, watched videos, and the pathogen sorter to retake the assessment?')) {
        localStorage.removeItem('hcid_quiz_answers');
        localStorage.removeItem('hcid_watched_videos');
        localStorage.removeItem('hcid_progress');
        localStorage.removeItem('hcid_sorter_passed');
        location.reload();
      }
    });
  }
}

function saveQuizAnswer(qId, selectedIdx, isCorrect) {
  const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
  quizData[qId] = { selectedIdx, isCorrect };
  localStorage.setItem('hcid_quiz_answers', JSON.stringify(quizData));
}

function loadSavedQuizAnswers() {
  const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
  Object.keys(quizData).forEach(qId => {
    const question = document.querySelector(`.quiz-question[data-qid="${qId}"]`);
    if (question) {
      question.classList.add('answered');
      const data = quizData[qId];
      const allOpts = question.querySelectorAll('.quiz-options li');
      const selectedOption = allOpts[data.selectedIdx];
      const feedback = question.querySelector('.quiz-feedback');
      const isCy = document.documentElement.lang === 'cy';

      if (selectedOption) selectedOption.classList.add('selected');

      if (data.isCorrect) {
        if (selectedOption) selectedOption.classList.add('correct');
        feedback.className = 'quiz-feedback show correct';
        feedback.textContent = (isCy ? '✓ Cywir! ' : '✓ Correct! ') + (selectedOption ? (selectedOption.dataset.explanation || (isCy ? 'Da iawn!' : 'Great job!')) : '');
      } else {
        if (selectedOption) selectedOption.classList.add('incorrect');
        allOpts.forEach(o => { if (o.dataset.correct === 'true') o.classList.add('correct'); });
        feedback.className = 'quiz-feedback show incorrect';
        feedback.textContent = (isCy ? '✗ Anghywir. ' : '✗ Incorrect. ') + (selectedOption ? (selectedOption.dataset.explanation || (isCy ? 'Gweler yr ateb cywir wedi\'i amlygu mewn gwyrdd.' : 'See the correct answer highlighted in green.')) : '');
      }
    }
  });

  calculateAssessmentScore();
  updateSimDashboardDots();
}

function updateSimDashboardDots() {
  const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
  for (let i = 1; i <= 10; i++) {
    const qId = `m10_q${i}`;
    const dot = document.querySelector(`.sim-step-dot[data-sim-step="${i}"]`);
    if (dot) {
      if (quizData[qId]) {
        dot.classList.add('completed');
        dot.textContent = '✓';
      } else {
        dot.classList.remove('completed');
        dot.textContent = i;
      }
    }
  }
}

function calculateAssessmentScore() {
  const isCy = document.documentElement.lang === 'cy';
  const quizQuestions = document.querySelectorAll('.quiz-question').length; // 37 questions
  const totalModules = document.querySelectorAll('.module-section').length; // 10 modules
  const sorterExists = document.querySelector('.sorter-container') !== null;
  const totalItems = quizQuestions + (sorterExists ? 1 : 0); // 38 assessment items total

  const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
  const sorterPassed = localStorage.getItem('hcid_sorter_passed') === 'true';

  let answeredCount = Object.keys(quizData).length + (sorterPassed ? 1 : 0);
  let correctCount = 0;
  Object.values(quizData).forEach(ans => {
    if (ans.isCorrect) correctCount++;
  });
  if (sorterPassed) correctCount++;

  const percentage = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;
  const passThresholdPct = 80;
  const passRequiredCount = totalItems > 0 ? Math.ceil((totalItems * passThresholdPct) / 100) : 31;

  const scoreValEl = document.getElementById('score-val');
  const answeredValEl = document.getElementById('answered-val');
  const passBadgeEl = document.getElementById('pass-badge');
  const passMsgEl = document.getElementById('pass-msg');

  const certBtn = document.getElementById('cert-trigger-btn');

  if (scoreValEl) scoreValEl.textContent = `${correctCount}/${totalItems} (${percentage}%)`;
  if (answeredValEl) answeredValEl.textContent = `${answeredCount}/${totalItems}`;

  if (passBadgeEl && passMsgEl) {
    if (answeredCount < totalItems) {
      passBadgeEl.className = 'pass-status-badge pending';
      passBadgeEl.textContent = isCy ? 'Asesiad yn Ar y Gweill' : 'Assessment In Progress';
      passMsgEl.textContent = isCy
        ? `Atebwch y 27 cwestiwn asesu + cwblhewch yr ymarfer Sortio Pathogenau + cwblhewch yr 10 Xenario Case Modiwl 10 (38 eitem asesu i gyd ar draws 10 modiwl). Marc llwyddo yw ${passThresholdPct}% (o leiaf ${passRequiredCount}/${totalItems} yn gywir).`
        : `Answer all 27 knowledge check questions + complete the Interactive Pathogen Sorter + complete all 10 Module 10 Clinical Case Scenarios (38 assessment items total across 10 modules). Pass threshold is ${passThresholdPct}% (at least ${passRequiredCount}/${totalItems} correct).`;
      if (certBtn) certBtn.style.display = 'none';
    } else if (percentage >= passThresholdPct) {
      passBadgeEl.className = 'pass-status-badge passed';
      passBadgeEl.textContent = isCy ? '✓ CWRS WEDI LLYWDDIO (80%+)' : '✓ COURSE PASSED (80%+ Achieved)';
      passMsgEl.innerHTML = isCy
        ? `<strong>Llongyfarchiadau!</strong> Wnaethoch chi gyflawni ${percentage}% (${correctCount}/${totalItems} yn gywir) ar asesiad hyfforddiant HCID, gan fodloni gofyniad llwyddo BIP Aneurin Bevan.`
        : `<strong>Congratulations!</strong> You achieved ${percentage}% (${correctCount}/${totalItems} correct) on the HCID training assessment, satisfying the Aneurin Bevan UHB pass requirement.`;
      if (certBtn) certBtn.style.display = 'inline-flex';
    } else {
      passBadgeEl.className = 'pass-status-badge failed';
      passBadgeEl.textContent = isCy ? '✗ ANGEN AILDDECHRAU (<80%)' : '✗ RETAKE REQUIRED (<80%)';
      passMsgEl.innerHTML = isCy
        ? `Sgoriwyd ${percentage}% (${correctCount}/${totalItems} yn gywir). Rhaid cael sgôr o leiaf 80% (${passRequiredCount}/${totalItems}) i lwyddo. Cliciwch "Ailosod yr Asesiad" isod i adolygu'r modiwlau ac ailddechrau.`
        : `You scored ${percentage}% (${correctCount}/${totalItems} correct). A score of at least 80% (${passRequiredCount}/${totalItems}) is required to pass. Please click "Reset Assessment" below to review the modules and retake the quiz.`;
      if (certBtn) certBtn.style.display = 'none';
    }
  }
}

/* --- Certificate System --- */
function initCertificateSystem() {
  const triggerBtn = document.getElementById('cert-trigger-btn');
  const modal = document.getElementById('cert-modal');
  const overlay = document.getElementById('certificate-overlay');
  const nameInput = document.getElementById('cert-user-name');
  const dateInput = document.getElementById('cert-user-date');
  const cancelBtn = document.getElementById('cert-modal-cancel');
  const generateBtn = document.getElementById('cert-modal-generate');
  const printBtn = document.getElementById('cert-print-btn');
  const closeBtn = document.getElementById('cert-close-btn');

  // Format today's date (en-GB format: e.g. 30 July 2026)
  const today = new Date();
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-GB', options);
  if (dateInput) dateInput.value = formattedDate;

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (modal) modal.classList.add('active');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (modal) modal.classList.remove('active');
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        alert('Please enter your name to generate your certificate.');
        if (nameInput) nameInput.focus();
        return;
      }

      const totalQuestions = document.querySelectorAll('.quiz-question').length;
      const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
      let correctCount = 0;
      Object.values(quizData).forEach(ans => { if (ans.isCorrect) correctCount++; });
      const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const displayName = document.getElementById('cert-display-name');
      const displayScore = document.getElementById('cert-display-score');
      const displayDate = document.getElementById('cert-display-date');

      if (displayName) displayName.textContent = name;
      if (displayScore) displayScore.textContent = `${correctCount}/${totalQuestions} (${percentage}%)`;
      if (displayDate) displayDate.textContent = (dateInput && dateInput.value) ? dateInput.value : formattedDate;

      if (modal) modal.classList.remove('active');
      if (overlay) overlay.classList.add('active');
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const originalTitle = document.title;
      document.title = 'HCID Certificate of Achievement';
      
      // Trigger print window
      window.print();
      
      document.title = originalTitle;

      // Automatically reset all quiz answers, watched videos, and progress after printing for the next nurse
      setTimeout(() => {
        localStorage.removeItem('hcid_quiz_answers');
        localStorage.removeItem('hcid_watched_videos');
        localStorage.removeItem('hcid_progress');
        location.reload();
      }, 500);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('active');
    });
  }
}

/* --- Video Interaction Tracking --- */
function initVideoTracking() {
  const watchedVideos = JSON.parse(localStorage.getItem('hcid_watched_videos') || '{}');

  document.querySelectorAll('.video-link').forEach(link => {
    const vid = link.dataset.vid;
    if (watchedVideos[vid]) {
      markVideoAsWatchedUI(link);
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetUrl = link.getAttribute('href');
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
      handleVideoWatched(vid, link.dataset.module, link);
    });
  });

  // Handle QR code clicks & mobile scanned buttons
  document.querySelectorAll('.btn-qr-mark-watched, .qr-code-img').forEach(el => {
    const vid = el.dataset.vid;
    const moduleId = el.dataset.module;
    if (!vid) return;

    if (watchedVideos[vid]) {
      markVideoAsWatchedUI(el);
    }

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      handleVideoWatched(vid, moduleId, el, true);
    });
  });
}

function handleVideoWatched(vid, moduleId, element, isMobileScan = false) {
  const currentWatched = JSON.parse(localStorage.getItem('hcid_watched_videos') || '{}');
  currentWatched[vid] = true;
  localStorage.setItem('hcid_watched_videos', JSON.stringify(currentWatched));

  markVideoAsWatchedUI(element);
  showVideoToastNotification(isMobileScan);

  if (moduleId) {
    evaluateModuleReadiness(moduleId);
  }
}

function showVideoToastNotification(isMobileScan = false) {
  const isCy = document.documentElement.lang === 'cy';
  let toast = document.querySelector('.toast-notification');
  if (toast) toast.remove();

  toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = isCy
    ? '🎥 <div><strong>Fideo wedi\'i agor mewn tab newydd</strong><br><span style="font-size:11px; opacity:0.9;">Pan fyddwch wedi gorffen gwylio, cau\'r tab fideo i ddychwelyd yma.</span></div>'
    : '🎥 <div><strong>Video opened in a new tab</strong><br><span style="font-size:11px; opacity:0.9;">When finished watching, simply close the video tab to return here.</span></div>';
  
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.remove();
    }
  }, 6000);
}

function markVideoAsWatchedUI(linkElement) {
  const isCy = document.documentElement.lang === 'cy';
  const card = linkElement.closest('.video-guide-card');
  if (card && !card.querySelector('.video-watched-badge')) {
    const h4 = card.querySelector('h4');
    if (h4) {
      const badge = document.createElement('span');
      badge.className = 'video-watched-badge';
      badge.innerHTML = isCy ? '✓ Fideo wedi\'i Wylio' : '✓ Video Watched';
      h4.appendChild(badge);
    }
  }
}

/* --- Module Progress & Completion Locking --- */
function getModuleRequirements(moduleId) {
  const section = document.getElementById(moduleId);
  if (!section) return { totalQ: 3, answeredQ: 0, totalVid: 0, watchedVid: 0 };

  const totalQ = section.querySelectorAll('.quiz-question').length || 3;
  const quizData = JSON.parse(localStorage.getItem('hcid_quiz_answers') || '{}');
  
  let answeredQ = 0;
  section.querySelectorAll('.quiz-question').forEach(q => {
    if (quizData[q.dataset.qid]) answeredQ++;
  });

  const videoLinks = section.querySelectorAll('.video-link');
  const totalVid = videoLinks.length;
  const watchedVideos = JSON.parse(localStorage.getItem('hcid_watched_videos') || '{}');
  
  let watchedVid = 0;
  videoLinks.forEach(v => {
    if (watchedVideos[v.dataset.vid]) watchedVid++;
  });

  return { totalQ, answeredQ, totalVid, watchedVid };
}

function evaluateModuleReadiness(moduleId) {
  const btn = document.querySelector(`.btn-complete[data-module="${moduleId}"]`);
  if (!btn) return;

  const isCy = document.documentElement.lang === 'cy';
  const req = getModuleRequirements(moduleId);
  const isQuestionsComplete = req.answeredQ >= req.totalQ;
  const isVideosComplete = req.totalVid === 0 || req.watchedVid >= req.totalVid;

  const progress = JSON.parse(localStorage.getItem('hcid_progress') || '{}');

  if (progress[moduleId] && isQuestionsComplete && isVideosComplete) {
    btn.classList.add('completed');
    btn.classList.remove('locked');
    btn.disabled = true;
    btn.innerHTML = isCy ? '✓ Modiwl wedi\'i Gyflawni' : '✓ Module Completed';
  } else if (isQuestionsComplete && isVideosComplete) {
    btn.classList.remove('locked', 'completed');
    btn.disabled = false;
    btn.innerHTML = isCy ? '✓ Cliciwch i Nodi bod y Modiwl yn Gyflawn' : '✓ Click to Mark Module Complete';
  } else {
    // Requirements not met: LOCK the module button
    btn.classList.add('locked');
    btn.classList.remove('completed');
    btn.disabled = true;

    // Clean up invalid progress if previously saved without meeting new rules
    if (progress[moduleId]) {
      delete progress[moduleId];
      localStorage.setItem('hcid_progress', JSON.stringify(progress));
      updateNavComplete(moduleId, false);
      updateProgressRing();
    }

    let statusMsg = '🔒 ';
    const isLinkModule = moduleId === 'module-4';

    if (!isQuestionsComplete && req.totalVid > 0 && !isVideosComplete) {
      if (isLinkModule) {
        statusMsg += isCy 
          ? `Atebwch y 3 Cwestiwn (${req.answeredQ}/3) a Clicio Dolenni (${req.watchedVid}/${req.totalVid})`
          : `Complete 3 Questions (${req.answeredQ}/3) & Click Links (${req.watchedVid}/${req.totalVid})`;
      } else {
        statusMsg += isCy 
          ? `Atebwch y 3 Cwestiwn (${req.answeredQ}/3) a Gwylio'r Fideos (${req.watchedVid}/${req.totalVid})`
          : `Complete 3 Questions (${req.answeredQ}/3) & Watch Videos (${req.watchedVid}/${req.totalVid})`;
      }
    } else if (!isQuestionsComplete) {
      if (moduleId === 'module-10') {
        statusMsg += isCy 
          ? `Atebwch yr 10 Xenario Case (${req.answeredQ}/10) i Ddigloi`
          : `Answer All 10 Case Scenarios (${req.answeredQ}/10) to Unlock`;
      } else {
        statusMsg += isCy 
          ? `Atebwch bob un o'r 3 Cwestiwn (${req.answeredQ}/3) i Ddigloi`
          : `Answer All 3 Questions (${req.answeredQ}/3) to Unlock`;
      }
    } else {
      if (isLinkModule) {
        statusMsg += isCy
          ? `Cliciwch yr Holl Ddolenni (${req.watchedVid}/${req.totalVid}) i Ddigloi`
          : `Click All Links (${req.watchedVid}/${req.totalVid}) to Unlock`;
      } else {
        statusMsg += isCy
          ? `Gwyliwch y Fideos Hyfforddiant (${req.watchedVid}/${req.totalVid}) i Ddigloi`
          : `Watch All Video Guides (${req.watchedVid}/${req.totalVid}) to Unlock`;
      }
    }
    btn.innerHTML = statusMsg;
  }
}

function initProgress() {
  const isCy = document.documentElement.lang === 'cy';
  document.querySelectorAll('.module-section').forEach(section => {
    evaluateModuleReadiness(section.id);
  });

  updateProgressRing();

  document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleId = btn.dataset.module;
      const req = getModuleRequirements(moduleId);
      
      if (req.answeredQ >= req.totalQ && (req.totalVid === 0 || req.watchedVid >= req.totalVid)) {
        btn.classList.add('completed');
        btn.disabled = true;
        btn.innerHTML = isCy ? '✓ Modiwl wedi\'i Gyflawni' : '✓ Module Completed';
        saveModuleComplete(moduleId);
        updateNavComplete(moduleId, true);
        updateProgressRing();
      }
    });
  });
}

function saveModuleComplete(moduleId) {
  const progress = JSON.parse(localStorage.getItem('hcid_progress') || '{}');
  progress[moduleId] = true;
  localStorage.setItem('hcid_progress', JSON.stringify(progress));
}

function updateNavComplete(moduleId, isComplete) {
  const navItem = document.querySelector(`.nav-item[href="#${moduleId}"]`);
  if (navItem) {
    if (isComplete) {
      navItem.classList.add('completed');
    } else {
      navItem.classList.remove('completed');
    }
  }
}

function updateProgressRing() {
  const progress = JSON.parse(localStorage.getItem('hcid_progress') || '{}');
  const total = document.querySelectorAll('.module-section').length;
  
  // Count only modules that are truly completed AND satisfy all requirements
  let completed = 0;
  document.querySelectorAll('.module-section').forEach(section => {
    const req = getModuleRequirements(section.id);
    if (progress[section.id] && req.answeredQ >= req.totalQ && (req.totalVid === 0 || req.watchedVid >= req.totalVid)) {
      completed++;
      updateNavComplete(section.id, true);
    } else {
      updateNavComplete(section.id, false);
    }
  });

  const pct = total > 0 ? (completed / total) * 100 : 0;

  const circle = document.querySelector('.progress-ring__fill');
  if (circle) {
    const circumference = 2 * Math.PI * 10;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (pct / 100) * circumference;
  }

  const label = document.getElementById('progress-label');
  if (label) label.textContent = `${completed}/${total}`;
}

/* --- Mobile Menu --- */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }
}

function closeMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* --- Doctor Interactive VHF Algorithm Scenario Simulator --- */
function initDoctorScenarios() {
  document.querySelectorAll('.sim-scenario-box').forEach(box => {
    const btns = box.querySelectorAll('.sim-btn');
    const feedback = box.querySelector('.sim-feedback-box');
    const isCy = document.documentElement.lang === 'cy';

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Clear previous selections
        btns.forEach(b => b.classList.remove('selected-correct', 'selected-incorrect'));
        
        const isCorrect = btn.dataset.correct === 'true';
        if (isCorrect) {
          btn.classList.add('selected-correct');
          if (feedback) {
            feedback.className = 'sim-feedback-box show correct';
            feedback.innerHTML = (isCy ? '<strong>✓ PENDERFYNIAD A LLWYBR CYWIR:</strong><br>' : '<strong>✓ CORRECT DECISION & PATHWAY:</strong><br>') + (btn.dataset.explanation || 'Great clinical judgment following the VHF Algorithm.');
          }
        } else {
          btn.classList.add('selected-incorrect');
          if (feedback) {
            feedback.className = 'sim-feedback-box show incorrect';
            feedback.innerHTML = (isCy ? '<strong>✗ DOSBARTHIAD RISG ANGHYWIR:</strong><br>' : '<strong>✗ INCORRECT RISK CATEGORISATION:</strong><br>') + (btn.dataset.explanation || 'Review the exposure details and algorithm flow above.');
          }
        }
      });
    });
  });
}

/* --- Interactive Pathogen Classification Sorter --- */
function initPathogenSorter() {
  const container = document.querySelector('.sorter-container');
  if (!container) return;

  const pool = container.querySelector('#pathogen-pool');
  const checkBtn = container.querySelector('#btn-check-sorter');
  const resetBtn = container.querySelector('#btn-reset-sorter');
  const feedback = container.querySelector('#sorter-feedback');
  const isCy = document.documentElement.lang === 'cy';

  let selectedChip = null;

  // 1. Click/Tap selection handler
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.pathogen-chip');
    const dropZone = e.target.closest('.sorter-drop-zone');

    // Clicked on a chip
    if (chip) {
      if (selectedChip === chip) {
        chip.classList.remove('selected');
        selectedChip = null;
      } else {
        if (selectedChip) selectedChip.classList.remove('selected');
        selectedChip = chip;
        chip.classList.add('selected');
      }
      return;
    }

    // Clicked on a drop zone while a chip is selected
    if (dropZone && selectedChip) {
      const targetContainer = dropZone.querySelector('.sorter-items-container');
      if (targetContainer) {
        targetContainer.appendChild(selectedChip);
        selectedChip.classList.remove('selected');
        selectedChip = null;
      }
    }
  });

  // 2. Drag and Drop handlers for desktop
  const chips = container.querySelectorAll('.pathogen-chip');
  chips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.dataset.name);
      chip.classList.add('dragging');
      selectedChip = chip;
    });

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
    });
  });

  const zones = container.querySelectorAll('.sorter-drop-zone');
  zones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const targetContainer = zone.querySelector('.sorter-items-container');
      if (selectedChip && targetContainer) {
        targetContainer.appendChild(selectedChip);
        selectedChip.classList.remove('selected');
        selectedChip = null;
      }
    });
  });

  // 3. Check sorting accuracy
  if (checkBtn) {
    checkBtn.addEventListener('click', () => {
      const allChips = container.querySelectorAll('.pathogen-chip');
      let totalCount = allChips.length;
      let correctlyPlaced = 0;
      let unsortedCount = 0;

      allChips.forEach(chip => {
        chip.classList.remove('correct-placed', 'incorrect-placed');
        const parentZone = chip.closest('.sorter-drop-zone');

        if (!parentZone) {
          unsortedCount++;
        } else {
          const acceptedType = parentZone.dataset.accept;
          const chipType = chip.dataset.type;

          if (acceptedType === chipType) {
            chip.classList.add('correct-placed');
            correctlyPlaced++;
          } else {
            chip.classList.add('incorrect-placed');
          }
        }
      });

      if (!feedback) return;

      if (unsortedCount > 0) {
        feedback.className = 'sorter-result-box show partial';
        feedback.innerHTML = isCy
          ? `<strong>⚠️ ${unsortedCount} Pathogen Wedi'u Ffrwyno Unsortiedig!</strong><br>Gosodwch bob un o'r ${totalCount} pathogen yn y blwch HCID Cyswllt neu HCID Awyr cyn gwirio.`
          : `<strong>⚠️ ${unsortedCount} Pathogen(s) Remaining Unsorted!</strong><br>Please place all ${totalCount} pathogens into either the Contact HCID or Airborne HCID box before checking your sorting accuracy.`;
      } else if (correctlyPlaced === totalCount) {
        localStorage.setItem('hcid_sorter_passed', 'true');
        calculateAssessmentScore();
        feedback.className = 'sorter-result-box show success';
        feedback.innerHTML = isCy
          ? `<strong>🎉 GWAITH ARDDERCHOG! POB 10/10 PATHOGEN WEDI'U DOSBARTHU'N CYWIR!</strong><br>` +
            `• <strong>HCIDau Cyswllt:</strong> Ebola, Marburg, Lassa, CCHF, Twymyn Gwaedlifol Ariannin (trosglwyddo trwy gwaed/hylifau).<br>` +
            `• <strong>HCIDau Awyr:</strong> MERS-CoV, Fflu'r Adar A(H5N1), Nipah, Pla Niwmonig, Feirws Hendra (trosglwyddo trwy aerosolau/defnynnau ac angen FFP3/PAPR ac ynysu).`
          : `<strong>🎉 EXCELLENT WORK! ALL 10/10 PATHOGENS CORRECTLY CLASSIFIED!</strong><br>` +
            `• <strong>Contact HCIDs:</strong> Ebola, Marburg, Lassa, CCHF, Argentine Haemorrhagic Fever (transmitted via direct blood/body fluids).<br>` +
            `• <strong>Airborne HCIDs:</strong> MERS-CoV, Avian Flu A(H5N1), Nipah, Pneumonic Plague, Hendra Virus (transmitted via aerosols/droplets requiring FFP3/PAPR & negative pressure isolation).`;
      } else {
        feedback.className = 'sorter-result-box show partial';
        feedback.innerHTML = isCy
          ? `<strong>⚠️ ${correctlyPlaced}/${totalCount} Pathogen Wedi'u Dosbarthu'n Cywir.</strong><br>` +
            `Eitemau mewn <span style="color: #dc2626; font-weight: bold;">COCH</span> yn y blwch anghywir. Adolygwch y llwybrau a'u symud!`
          : `<strong>⚠️ ${correctlyPlaced}/${totalCount} Pathogens Correctly Classified.</strong><br>` +
            `Items highlighted in <span style="color: #dc2626; font-weight: bold;">RED</span> are in the incorrect box. Review disease transmission routes and adjust their positions!`;
      }
    });
  }

  // 4. Reset Sorter
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const allChips = container.querySelectorAll('.pathogen-chip');
      allChips.forEach(chip => {
        chip.classList.remove('selected', 'correct-placed', 'incorrect-placed');
        pool.appendChild(chip);
      });

      if (selectedChip) {
        selectedChip.classList.remove('selected');
        selectedChip = null;
      }

      if (feedback) {
        feedback.className = 'sorter-result-box';
        feedback.innerHTML = '';
      }

      localStorage.removeItem('hcid_sorter_passed');
      calculateAssessmentScore();
    });
  }
}


