import { definePanel } from '@directus/extensions-sdk'
import PanelComponent from './panel.vue'
import { PERIODS } from './api'

export default definePanel({
  id: 'privatus-analytics',
  name: 'Privatus Analytics',
  icon: 'insights',
  description: 'Visitors, pageviews and top pages of your website from Privatus Analytics.',
  component: PanelComponent,
  options: [
    {
      field: 'token',
      name: 'API token',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'full',
        required: true,
        options: { masked: true, placeholder: 'pat_...', trim: true },
        note: 'Create a token in Privatus Analytics under Workspace settings, API tokens, with only the analytics.read permission and only this site. Anyone who can edit this dashboard can see it.',
      },
    },
    {
      field: 'siteId',
      name: 'Site id',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        required: true,
        options: { placeholder: 'pa_XXXXXXXXXX', trim: true },
        note: 'In Privatus Analytics under Site settings, Tracking.',
      },
    },
    {
      field: 'period',
      name: 'Period',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: { choices: PERIODS.map((p) => ({ text: p.text, value: p.value })) },
      },
      schema: { default_value: '7d' },
    },
    {
      field: 'topPages',
      name: 'Top pages to show',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        options: { min: 0, max: 50 },
      },
      schema: { default_value: 5 },
    },
  ],
  minWidth: 12,
  minHeight: 8,
})
