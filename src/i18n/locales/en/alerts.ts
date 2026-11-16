import type { AlertsTranslations } from '../../types';

export const alerts: AlertsTranslations = {
  unplacedBannerTitle: 'Some elements could not be accommodated on the current sheet:',
  unplacedBannerItem: '{name} ({quantity} pcs. — {width}×{height} mm): {reason}',
  deletePresetConfirm: 'Are you sure you want to delete format "{name}"?',
  storageError: 'Error saving to local storage',
  resetPricingConfirm: 'Reset all cost parameters to factory defaults?',
  paperUnutilized: '{percent}% unutilized paper',
};
