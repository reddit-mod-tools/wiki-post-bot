import type { Form, FormField } from '@devvit/shared-types/shared/form.js';

export function buildDetailsParagraphForm(
  title: string,
  details: string,
  label = 'Details'
): Form {
  return {
    title,
    acceptLabel: 'Done',
    fields: [
      {
        name: 'details',
        label,
        type: 'paragraph',
        lineHeight: 40,
        defaultValue: details,
        disabled: true,
      },
    ] satisfies FormField[],
  };
}
