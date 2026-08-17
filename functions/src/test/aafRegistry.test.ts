import { aafJobRegistry } from '../academicFactory/core/aafJobRegistry';

describe('AAF Canonical Registry (AAF-004D FIX2)', () => {
  const canonicalTypes = aafJobRegistry.getCanonicalTypes();

  test('🛡️ CANONICAL_TYPE_TESTED: identifies exactly 13 types', () => {
    expect(canonicalTypes.length).toBe(13);
  });

  test('🛡️ REGISTRY_CENSUS: verifies current binding status', () => {
    const registered = aafJobRegistry.getRegisteredTypes();

    // Exact count of bound workers in this commit
    expect(registered.length).toBe(6);

    const expectedBound = [
        'sourceAcquisition',
        'sourceValidation',
        'digibookDraft',
        'digibookRepair',
        'digibookMaterialization',
        'crucibleMaterialization'
    ];

    expectedBound.forEach(type => {
        expect(registered).toContain(type);
        expect(aafJobRegistry.getHandler(type)).toBeDefined();
    });
  });

  test('🛡️ NON_CANONICAL_TYPE_ATTACKS: rejects unauthorized types', () => {
    const attacks = [
        'structural', 'svo', 'manifest', 'encoding', 'repair', // Legacy internal names
        'mcqDraft', 'mcqValidation', 'revisionDraft', 'revisionValidation', // Drifted names
        'randomTask', 'aiHacking', ''
    ];

    expect(attacks.length).toBe(12);

    attacks.forEach(type => {
        expect(aafJobRegistry.getHandler(type)).toBeUndefined();
    });
  });

  test('🛡️ HANDLER_OWNER_COLLISIONS: zero duplicate handlers', () => {
      const registered = aafJobRegistry.getRegisteredTypes();
      const unique = new Set(registered);
      expect(unique.size).toBe(registered.length);
  });
});
