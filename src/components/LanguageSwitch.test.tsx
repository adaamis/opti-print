import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetLanguageForTesting, setLanguage } from '../i18n';
import { LanguageSwitch } from './LanguageSwitch';

describe('LanguageSwitch component', () => {
  beforeEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  afterEach(() => {
    resetLanguageForTesting('pt-BR');
  });

  it('renders accessible segmented control with role="group" and PT / EN buttons', () => {
    const html = renderToStaticMarkup(<LanguageSwitch />);

    expect(html).toContain('class="lang-switch');
    expect(html).toContain('role="group"');
    expect(html).toContain('data-i18n-aria-label="nav.selectLanguage"');

    // PT active by default
    expect(html).toContain('data-i18n="nav.langPt"');
    expect(html).toContain('data-i18n="nav.langEn"');
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*data-i18n="nav\.langPt"/);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*data-i18n="nav\.langEn"/);
    expect(html).toContain('PT');
    expect(html).toContain('EN');

    // Translator icon removed — only PT and EN labels should remain
    expect(html).not.toContain('<svg');
  });

  it('reflects active state when current language is English', () => {
    setLanguage('en');
    const html = renderToStaticMarkup(<LanguageSwitch />);

    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*data-i18n="nav\.langPt"/);
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*data-i18n="nav\.langEn"/);
  });
});
