/* Cargo Siberia — общий JS сайта: меню, модалка формы, анимации, антиспам, отправка заявки */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById('burger-btn');
  var mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('hidden');
      burger.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  /* ---------- Все кнопки "Оставить заявку": скролл к форме или открытие модалки ---------- */
  document.querySelectorAll('[data-cta="request"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (btn.dataset.mode === 'modal') {
        e.preventDefault();
        openModal();
      }
      // иначе — обычная ссылка-якорь на #request-form, плавный скролл через CSS scroll-behavior
    });
  });

  /* ---------- Модальное окно формы ---------- */
  var modal = document.getElementById('request-modal');
  var modalPanel = document.getElementById('request-modal-panel');
  var modalCloseBtns = document.querySelectorAll('[data-close-modal]');

  function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    requestAnimationFrame(function () {
      modalPanel.classList.remove('scale-95', 'opacity-0');
    });
    var firstInput = modal.querySelector('input, textarea');
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    if (!modal) return;
    modalPanel.classList.add('scale-95', 'opacity-0');
    document.body.classList.remove('overflow-hidden');
    setTimeout(function () {
      modal.classList.add('hidden');
    }, 200);
  }

  modalCloseBtns.forEach(function (b) {
    b.addEventListener('click', closeModal);
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
  }

  /* ---------- Простая антиспам-капча (мат. пример) для каждой формы ---------- */
  document.querySelectorAll('[data-captcha]').forEach(function (wrap) {
    var a = Math.floor(Math.random() * 8) + 1;
    var b = Math.floor(Math.random() * 8) + 1;
    wrap.dataset.answer = String(a + b);
    var label = wrap.querySelector('[data-captcha-label]');
    if (label) label.textContent = 'Сколько будет ' + a + ' + ' + b + '?';
  });

  /* ---------- Обработка отправки форм заявки ---------- */
  document.querySelectorAll('form[data-request-form]').forEach(function (form) {
    attachFormHandler(form);
  });

  function attachFormHandler(form) {
    var successBox = form.querySelector('[data-success]');
    var errorBox = form.querySelector('[data-error]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errorBox) errorBox.classList.add('hidden');

      // Honeypot: если скрытое поле заполнено — это бот, тихо "успешно" завершаем
      var honeypot = form.querySelector('input[name="website"]');
      if (honeypot && honeypot.value) {
        showSuccess();
        form.reset();
        return;
      }

      // Проверка обязательных полей
      var requiredFields = form.querySelectorAll('[required]');
      var valid = true;
      requiredFields.forEach(function (field) {
        field.classList.remove('border-red-500');
        if (!field.value || (field.type === 'checkbox' && !field.checked)) {
          valid = false;
          field.classList.add('border-red-500');
        }
      });

      // Валидация телефона/мессенджера — минимум 5 значащих символов
      var phoneField = form.querySelector('input[name="phone"]');
      if (phoneField) {
        var digits = phoneField.value.replace(/\D/g, '');
        var looksLikeContact = digits.length >= 5 || phoneField.value.trim().length >= 5;
        if (!looksLikeContact) {
          valid = false;
          phoneField.classList.add('border-red-500');
        }
      }

      // Простая e-mail проверка, если поле заполнено
      var emailField = form.querySelector('input[name="email"]');
      if (emailField && emailField.value) {
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value);
        if (!emailOk) {
          valid = false;
          emailField.classList.add('border-red-500');
        }
      }

      // Проверка антиспам-капчи
      var captchaWrap = form.querySelector('[data-captcha]');
      if (captchaWrap) {
        var captchaInput = captchaWrap.querySelector('input');
        var expected = captchaWrap.dataset.answer;
        if (!captchaInput || captchaInput.value.trim() !== expected) {
          valid = false;
          if (captchaInput) captchaInput.classList.add('border-red-500');
        }
      }

      if (!valid) {
        if (errorBox) errorBox.classList.remove('hidden');
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());

      // -----------------------------------------------------------------
      // ЗАГЛУШКА ОТПРАВКИ ЗАЯВКИ.
      // Здесь нужно подключить реальную отправку данных заказчику, например:
      //   - fetch('/api/lead', { method: 'POST', body: JSON.stringify(data) })
      //   - отправку на e-mail через backend-скрипт (PHP/Node) или сервис форм
      //     (Formspree, GetForm, Web3Forms и т.п.);
      //   - отправку уведомления в Telegram-бота компании (Bot API sendMessage);
      //   - интеграцию с CRM (amoCRM, Bitrix24) через их API/webhook.
      // Сейчас заявка только логируется в консоль браузера.
      // -----------------------------------------------------------------
      console.log('Новая заявка Cargo Siberia:', data);

      showSuccess();
      form.reset();

      // Обновляем капчу после отправки
      if (captchaWrap) {
        var a2 = Math.floor(Math.random() * 8) + 1;
        var b2 = Math.floor(Math.random() * 8) + 1;
        captchaWrap.dataset.answer = String(a2 + b2);
        var label2 = captchaWrap.querySelector('[data-captcha-label]');
        if (label2) label2.textContent = 'Сколько будет ' + a2 + ' + ' + b2 + '?';
      }
    });

    function showSuccess() {
      if (successBox) {
        successBox.classList.remove('hidden');
        setTimeout(function () {
          successBox.classList.add('hidden');
          if (modal && form.closest('#request-modal')) closeModal();
        }, 3200);
      } else {
        alert('Спасибо! Мы свяжемся с вами в ближайшее время.');
      }
    }
  }

  /* ---------- Анимации появления при скролле ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('reveal-visible'); });
  }

  /* ---------- Плавающая кнопка мессенджеров ---------- */
  var fabToggle = document.getElementById('fab-toggle');
  var fabWrap = document.getElementById('fab-wrap');
  if (fabToggle && fabWrap) {
    fabToggle.addEventListener('click', function () {
      fabWrap.classList.toggle('fab-open');
    });
  }

  /* ---------- Sticky-шапка: лёгкая тень при прокрутке ---------- */
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 8) {
        header.classList.add('shadow-md');
      } else {
        header.classList.remove('shadow-md');
      }
    });
  }

  /* ---------- Отзывы: карусель со стрелками ---------- */
  var track = document.getElementById('reviews-track');
  var prevBtn = document.getElementById('reviews-prev');
  var nextBtn = document.getElementById('reviews-next');
  if (track && prevBtn && nextBtn) {
    var scrollAmount = function () {
      var card = track.querySelector('[data-review-card]');
      return card ? card.offsetWidth + 24 : 300;
    };
    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });
  }

  /* ---------- Текущий год в подвале ---------- */
  var yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
