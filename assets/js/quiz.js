/* ==========================================================================
   ثلاثة الأصول — منطق الاختبار
   أسئلة متعددة · أربعة خيارات · واحد صحيح · النتيجة من المجموع
   ========================================================================== */
(function () {
  'use strict';

  var QUESTIONS = window.QUIZ || [];
  var TOTAL = QUESTIONS.length;

  var AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function ar(n) {
    return String(n).split('').map(function (d) {
      return AR_DIGITS[Number(d)] !== undefined ? AR_DIGITS[Number(d)] : d;
    }).join('');
  }

  var idx = 0;        // رقم السؤال الحالي
  var score = 0;      // عدد الإجابات الصحيحة
  var answered = false;
  var mistakes = [];

  var el = {
    card: document.getElementById('quizCard'),
    qNum: document.getElementById('qNum'),
    qText: document.getElementById('qText'),
    options: document.getElementById('qOptions'),
    feedback: document.getElementById('qFeedback'),
    verdict: document.getElementById('qVerdict'),
    why: document.getElementById('qWhy'),
    next: document.getElementById('qNext'),
    fill: document.getElementById('quizFill'),
    progress: document.getElementById('quizProgress'),
    result: document.getElementById('quizResult'),
    scoreNum: document.getElementById('scoreNum'),
    ringFg: document.getElementById('ringFg'),
    resultTitle: document.getElementById('resultTitle'),
    resultText: document.getElementById('resultText'),
    retry: document.getElementById('retryBtn'),
    review: document.getElementById('quizReview'),
    reviewList: document.getElementById('reviewList'),
    leadCount: document.getElementById('quizLeadCount'),
    scoreTotal: document.getElementById('scoreTotal')
  };

  if (!el.card || !TOTAL) return;

  /* ---------- ضبط الأعداد حسب حجم بنك الأسئلة ---------- */
  (function setCounts() {
    if (el.scoreTotal) el.scoreTotal.textContent = ar(TOTAL);
    if (el.leadCount) {
      el.leadCount.textContent = TOTAL === 1
        ? 'سؤال واحد'
        : (TOTAL === 2 ? 'سؤالان' : (TOTAL <= 10 ? ar(TOTAL) + ' أسئلة' : ar(TOTAL) + ' سؤالاً'));
    }
    var bar = document.getElementById('quizProgress');
    if (bar) bar.textContent = 'السؤال ' + ar(1) + ' من ' + ar(TOTAL);
  })();

  /* ---------- بناء سؤال ---------- */
  function render() {
    var q = QUESTIONS[idx];
    answered = false;

    el.qNum.textContent = ar(idx + 1);
    el.qText.textContent = q.q;
    el.options.innerHTML = '';
    el.feedback.hidden = true;
    el.next.hidden = true;

    q.opts.forEach(function (text, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.setAttribute('data-i', String(i));
      b.innerHTML =
        '<span class="opt-mark" aria-hidden="true"></span>' +
        '<span class="opt-text"></span>';
      b.querySelector('.opt-text').textContent = text;
      b.addEventListener('click', function () { choose(i, b); });
      el.options.appendChild(b);
    });

    el.progress.textContent = 'السؤال ' + ar(idx + 1) + ' من ' + ar(TOTAL);
    el.fill.style.width = ((idx) / TOTAL * 100) + '%';
    el.card.classList.remove('shake');
    // إعادة التشغيل：从 اليمين
    el.card.style.animation = 'none';
    void el.card.offsetWidth;
    el.card.style.animation = '';
  }

  /* ---------- اختيار إجابة ---------- */
  function choose(picked, btn) {
    if (answered) return;
    answered = true;

    var q = QUESTIONS[idx];
    var correct = q.ok === picked;
    var nodes = el.options.querySelectorAll('.opt');

    nodes.forEach(function (n, i) {
      n.classList.add('locked');
      n.disabled = true;
      if (i === q.ok) n.classList.add('is-correct');
      else if (i === picked) n.classList.add('is-wrong');
    });

    if (correct) {
      score++;
      el.verdict.textContent = 'إجابة صحيحة';
      el.verdict.className = 'quiz-verdict ok';
    } else {
      el.verdict.textContent = 'إجابة غير صحيحة';
      el.verdict.className = 'quiz-verdict bad';
      mistakes.push({ q: q, chosen: q.opts[picked] });
      el.card.classList.add('shake');
    }

    el.why.textContent = q.why;
    el.feedback.hidden = false;
    el.next.hidden = false;
    el.next.textContent = (idx === TOTAL - 1) ? 'اعرض النتيجة' : 'السؤال التالي';
    el.fill.style.width = ((idx + 1) / TOTAL * 100) + '%';
    el.next.focus();
  }

  /* ---------- النتيجة ---------- */
  function finish() {
    el.card.hidden = true;
    el.result.hidden = false;

    el.scoreNum.textContent = ar(score);
    el.fill.style.width = '100%';
    el.progress.textContent = 'انتهى الاختبار';

    var C = 2 * Math.PI * 52;
    el.ringFg.style.strokeDasharray = C;
    el.ringFg.style.strokeDashoffset = C;

    requestAnimationFrame(function () {
      el.ringFg.style.strokeDashoffset = C - (C * score / TOTAL);
    });

    if (score === TOTAL) {
      el.result.className = 'quiz-result perfect';
      el.resultTitle.textContent = 'ما شاء الله، أجبتَ عن الأسئلة كلها إجابة صحيحة';
      el.resultText.textContent = 'نتيجتك ' + ar(TOTAL) + ' من ' + ar(TOTAL) + '. فقد أتقنتَ الأصول الثلاثة: ربَّك ودينَك ونبيَّك صلى الله عليه وسلم. بارك الله فيك.';
    } else {
      el.result.className = 'quiz-result partial';
      el.resultTitle.textContent = 'نتيجتك ' + ar(score) + ' من ' + ar(TOTAL);
      el.resultText.textContent =
        'لم تكتمل الإجابات الصحيحة بعد. راجع صفحات الأصول الثلاثة من جديد، ثم أعد الاختبار — ويمكنك أن تعرف أين أخطأت في الأسفل.';
    }

    if (mistakes.length) {
      el.reviewList.innerHTML = '';
      mistakes.forEach(function (m, i) {
        var row = document.createElement('div');
        row.className = 'review-item';
        var h = document.createElement('h3');
        h.textContent = 'الخطأ ' + ar(i + 1) + ': ' + m.q.q;
        var pick = document.createElement('p');
        pick.className = 'review-pick';
        pick.textContent = 'إجابتك: ' + m.chosen;
        var right = document.createElement('p');
        right.className = 'review-right';
        right.textContent = 'الصحيح: ' + m.q.opts[m.q.ok];
        var why = document.createElement('p');
        why.className = 'review-why';
        why.textContent = m.q.why;
        row.appendChild(h); row.appendChild(pick); row.appendChild(right); row.appendChild(why);
        el.reviewList.appendChild(row);
      });
      el.review.hidden = false;
    } else {
      el.review.hidden = true;
    }

    el.result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- التالي ---------- */
  el.next.addEventListener('click', function () {
    if (idx < TOTAL - 1) { idx++; render(); el.card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else { finish(); }
  });

  /* ---------- إعادة الاختبار ---------- */
  el.retry.addEventListener('click', function () {
    idx = 0; score = 0; mistakes = [];
    el.result.hidden = true;
    el.review.hidden = true;
    el.card.hidden = false;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  render();
})();