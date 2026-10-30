/* UI strings: Ukrainian (default for Masha) and English. */
(function (global) {
  const STR = {
    en: {
      nav_home: 'Home', nav_plan: 'Plan', nav_progress: 'Progress',
      hello: 'Hi, {name}!',
      starts_on: 'First workout: {date}',
      days_left: '{n} days to go',
      start_today: 'Today is the day! 💪',
      started: 'You are on your way!',
      your_plan: 'Your plan',
      workouts_done: '{done} of {total} workouts done',
      next_workout: 'Next workout',
      all_done: 'All workouts done. You did it!',
      btn_start: 'Start', btn_continue: 'Continue', btn_view: 'View again',
      week_n: 'Week {n}',
      min: 'min', sec: 'sec', reps: 'reps',
      exercises_n: '{n} exercises',
      approx_time: 'about {n} min',
      done_badge: 'Done',
      level_n: 'Level {n}',
      xp_n: '{n} XP',
      xp_to_next: '{n} XP to the next level',
      max_level: 'Top level!',
      levels: ['Little seed', 'Blooming flower', 'Gym bunny', 'Strong star', 'Queen'],
      badges: 'Badges',
      badge_first: 'First step', badge_first_d: 'Finish your first workout',
      badge_week1: 'Week 1', badge_week1_d: 'Finish 2 workouts',
      badge_sets: '20 sets', badge_sets_d: 'Tick 20 sets',
      badge_perfect: 'Perfect', badge_perfect_d: 'Tick every set in one workout',
      badge_weigh: 'Tracker', badge_weigh_d: 'Add a weigh-in',
      badge_all: 'Champion', badge_all_d: 'Finish the whole plan',
      how_to: 'How to do it',
      benefits: 'Why it is good',
      tips: 'Tips',
      watch: 'Watch how',
      play_video: 'Play video',
      no_machine: 'Machine busy or missing?',
      use_instead: 'Use instead: {name}',
      back_original: 'Back to the first choice',
      instead_of: 'Instead of {name}',
      muscles: 'Works',
      equipment: 'You need',
      set_n: 'Set {n}',
      kg: 'kg',
      weight_ph: 'kg used',
      rest: 'Rest', skip: 'Skip',
      rest_done: 'Ready for the next set!',
      finish: 'Finish workout',
      finish_hint: 'Tick each set when it is done.',
      safety: 'If something hurts, stop and message me.',
      celebrate_t: 'Workout done!',
      celebrate_m: ['You showed up and did it. I am so proud of you! 💖', 'Great job! Your body says thank you. ✨', 'Another step done. You are getting stronger! 💪'],
      program_t: 'Plan complete!',
      program_m: 'Two weeks done. You learned the moves and you did it all. Time for the next level. 👑',
      xp_earned: '+{n} XP',
      next_btn: 'Next workout', home_btn: 'Back home', close: 'Close',
      body_t: 'My body',
      height: 'Height', start_w: 'Start', now_w: 'Now', change_w: 'Change',
      cm: 'cm',
      add_w: 'Add weight', save: 'Save', date: 'Date',
      body_note: 'Numbers are only information. How you feel matters most. 💗',
      no_weighins: 'No weigh-ins yet. Add the first one.',
      history: 'Workout history',
      no_history: 'Your finished workouts will appear here.',
      telegram_btn: 'Message coach',
      lang_label: 'Language',
      loading: 'Loading…',
      load_error: 'Could not load the plan. Check your internet and refresh.',
      gym_t: 'Your gym', open_site: 'Open gym website',
      edit_start: 'Change start weight',
      not_found: 'Page not found',
      sets_done: '{done}/{total} sets',
      instead_note: 'Swapped',
    },
    uk: {
      nav_home: 'Головна', nav_plan: 'План', nav_progress: 'Прогрес',
      hello: 'Привіт, {name}!',
      starts_on: 'Перше тренування: {date}',
      days_left: 'Днів до старту: {n}',
      start_today: 'Сьогодні той самий день! 💪',
      started: 'Ти вже в дорозі!',
      your_plan: 'Твій план',
      workouts_done: 'Виконано {done} з {total} тренувань',
      next_workout: 'Наступне тренування',
      all_done: 'Усі тренування виконано. Ти молодець!',
      btn_start: 'Почати', btn_continue: 'Продовжити', btn_view: 'Переглянути ще раз',
      week_n: 'Тиждень {n}',
      min: 'хв', sec: 'с', reps: 'повт.',
      exercises_n: 'Вправ: {n}',
      approx_time: 'приблизно {n} хв',
      done_badge: 'Виконано',
      level_n: 'Рівень {n}',
      xp_n: '{n} XP',
      xp_to_next: 'До наступного рівня: {n} XP',
      max_level: 'Найвищий рівень!',
      levels: ['Насінинка', 'Квітка, що цвіте', 'Спортивне зайченя', 'Сильна зірочка', 'Королева'],
      badges: 'Нагороди',
      badge_first: 'Перший крок', badge_first_d: 'Заверши перше тренування',
      badge_week1: 'Тиждень 1', badge_week1_d: 'Заверши 2 тренування',
      badge_sets: '20 підходів', badge_sets_d: 'Відміть 20 підходів',
      badge_perfect: 'Ідеально', badge_perfect_d: 'Відміть усі підходи в одному тренуванні',
      badge_weigh: 'Облік', badge_weigh_d: 'Додай зважування',
      badge_all: 'Чемпіонка', badge_all_d: 'Заверши весь план',
      how_to: 'Як виконувати',
      benefits: 'Чим корисно',
      tips: 'Поради',
      watch: 'Подивись, як це робити',
      play_video: 'Дивитися відео',
      no_machine: 'Тренажер зайнятий або його немає?',
      use_instead: 'Замінити на: {name}',
      back_original: 'Повернутися до першого вибору',
      instead_of: 'Замість: {name}',
      muscles: 'Працюють',
      equipment: 'Потрібно',
      set_n: 'Підхід {n}',
      kg: 'кг',
      weight_ph: 'вага, кг',
      rest: 'Відпочинок', skip: 'Пропустити',
      rest_done: 'Готова до наступного підходу!',
      finish: 'Завершити тренування',
      finish_hint: 'Відмічай кожен підхід, коли він виконаний.',
      safety: 'Якщо щось болить — зупинись і напиши мені.',
      celebrate_t: 'Тренування виконано!',
      celebrate_m: ['Ти прийшла й зробила це. Я дуже тобою пишаюся! 💖', 'Чудова робота! Твоє тіло каже дякую. ✨', 'Ще один крок зроблено. Ти стаєш сильнішою! 💪'],
      program_t: 'План виконано!',
      program_m: 'Два тижні позаду. Ти вивчила рухи й виконала все. Час для наступного рівня. 👑',
      xp_earned: '+{n} XP',
      next_btn: 'Наступне тренування', home_btn: 'На головну', close: 'Закрити',
      body_t: 'Моє тіло',
      height: 'Зріст', start_w: 'Старт', now_w: 'Зараз', change_w: 'Зміна',
      cm: 'см',
      add_w: 'Додати вагу', save: 'Зберегти', date: 'Дата',
      body_note: 'Цифри — це лише інформація. Найважливіше, як ти почуваєшся. 💗',
      no_weighins: 'Зважувань ще немає. Додай перше.',
      history: 'Історія тренувань',
      no_history: 'Тут з’являтимуться виконані тренування.',
      telegram_btn: 'Написати тренеру',
      lang_label: 'Мова',
      loading: 'Завантаження…',
      load_error: 'Не вдалося завантажити план. Перевір інтернет і онови сторінку.',
      gym_t: 'Твій зал', open_site: 'Відкрити сайт залу',
      edit_start: 'Змінити стартову вагу',
      not_found: 'Сторінку не знайдено',
      sets_done: '{done}/{total} підходів',
      instead_note: 'Замінено',
    },
  };

  let lang = 'en';
  try {
    const saved = localStorage.getItem('mg_lang');
    if (saved === 'uk' || saved === 'en') lang = saved;
    else lang = (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'uk';
  } catch (e) { lang = 'uk'; }

  function t(key, vars) {
    let s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
    if (typeof s !== 'string') return s;
    if (vars) for (const k in vars) s = s.replaceAll('{' + k + '}', vars[k]);
    return s;
  }
  // pick language from a {en, uk} object, fall back to the other language
  function L(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    const v = obj[lang];
    if (Array.isArray(v)) return v.length ? v : obj.en || [];
    return v || obj.en || obj.uk || '';
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('mg_lang', l); } catch (e) {}
    document.documentElement.lang = l;
  }
  document.documentElement.lang = lang;

  global.I18N = { t, L, setLang, getLang: () => lang, STR };
})(window);
