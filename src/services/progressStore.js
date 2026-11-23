const STORAGE_KEY = 'tb1';
const EMPTY_PROGRESS = { stars: [], best: [], skin: 0, tbest: 0, sbest: 0, name: '' };

/** Carica il formato di salvataggio preesistente per non azzerare i progressi. */
export function loadProgress() {
  try {
    return { ...EMPTY_PROGRESS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
}

/** Scrive lo stesso schema usato dalla versione HTML precedente. */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Impossibile salvare i progressi nel browser.', error);
  }
}
