import { normalizeCompanyName, findDuplicateGroups, MatchResult } from '../findDuplicates';

describe('normalizeCompanyName', () => {
  it('removes noise words and punctuation', () => {
    expect(normalizeCompanyName('Ubisoft Inc.')).toBe('ubisoft');
    expect(normalizeCompanyName('Sony Interactive Entertainment')).toBe('sony');
    expect(normalizeCompanyName('NINTENDO CO. LTD.')).toBe('nintendo');
  });

  it('removes accents and normalizes spacing', () => {
    expect(normalizeCompanyName('Montréal')).toBe('montreal');
    expect(normalizeCompanyName('  Ubisoft     Montreal  ')).toBe('ubisoft montreal');
  });
});

describe('findDuplicateGroups', () => {
  it('groups names with strong token similarity', () => {
    const companies = [
      'Ubisoft Montreal',
      'Ubisoft Canada',
      'Ubisoft Studios',
      'Ubisoft Inc.',
      'Ubisoft'
    ];

    const results: MatchResult[] = findDuplicateGroups(companies, 0.5);
    const grouped = results.flatMap(g => g.group);
    expect(grouped).toEqual(expect.arrayContaining(['Ubisoft', 'Ubisoft Inc.']));
  });

  it('detects grouping despite small variations', () => {
    const companies = [
      'EA Games',
      'E.A. Games',
      'Electronic Arts',
      'Electronic Arts Inc.'
    ];

    const results: MatchResult[] = findDuplicateGroups(companies, 0.5);
    const grouped = results.flatMap(g => g.group);
    expect(grouped).toEqual(expect.arrayContaining(['EA Games', 'E.A. Games']));
  });

  it('ignores names with low similarity', () => {
    const companies = ['Valve', 'Sony', 'Nintendo'];
    const results = findDuplicateGroups(companies, 0.5);
    expect(results.length).toBe(0);
  });

  it('does not group if only noise words differ', () => {
    const companies = [
      'Sunfire Software',
      'Sunfire Studios'
    ];

    const results = findDuplicateGroups(companies, 0.5);
    expect(results.length).toBe(1);
    expect(results[0].group).toEqual(expect.arrayContaining(['Sunfire Software', 'Sunfire Studios']));
  });

  it('handles similar short names with variation', () => {
    const companies = ['Sony Ltd', 'Sony'];
    const results = findDuplicateGroups(companies, 0.5);
    expect(results.length).toBe(1);
    expect(results[0].group).toEqual(expect.arrayContaining(['Sony', 'Sony Ltd']));
  });
});
