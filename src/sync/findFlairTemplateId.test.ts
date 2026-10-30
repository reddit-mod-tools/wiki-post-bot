import { describe, expect, it } from 'vitest';
import { findFlairTemplateId } from '@/sync/findFlairTemplateId';

describe(findFlairTemplateId, () => {
  it('matches flair text ignoring case and spaces', () => {
    expect(findFlairTemplateId(templates, ' announcement ')).toBe('id-2');
  });

  it('lists the available flair when nothing matches', () => {
    expect(() => findFlairTemplateId(templates, 'Anouncement')).toThrow(
      'no post flair named "Anouncement". Available flair: "Discussion", "Announcement"'
    );
  });
});

const templates = [
  { id: 'id-1', text: 'Discussion' },
  { id: 'id-2', text: 'Announcement' },
];
