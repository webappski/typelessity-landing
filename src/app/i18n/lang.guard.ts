import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { isLang, DEFAULT_LANG } from './i18n.config';
import { TranslationService } from './translation.service';

export const langGuard: CanActivateFn = (route) => {
  const t = inject(TranslationService);
  const router = inject(Router);
  const lang = route.paramMap.get('lang');

  if (lang && isLang(lang)) {
    t.setLang(lang);
    return true;
  }

  return router.createUrlTree([`/${DEFAULT_LANG}`]);
};
