/**
 * Unit Tests: Pricing Utilities
 * Tests subscription pricing, tier limits, and upgrade recommendations
 */

import {
  getTierPrice,
  getTierCollectionsLimit,
  getTierTeamMembersLimit,
  getAnnualSavings,
  getMonthlyEquivalentPrice,
  mapLegacyTierToV3,
  hasExceededCollectionsLimit,
  calculateOverageCost,
  getRecommendedUpgrade,
  calculateLTV,
  formatPrice,
  getAnnualDiscountPercentage,
  PRICING_TIERS,
  type PricingTier,
  type LegacyTier,
} from '@/lib/pricing';

describe('PRICING_TIERS constant', () => {
  it('should have all three pricing tiers', () => {
    expect(PRICING_TIERS).toHaveProperty('starter');
    expect(PRICING_TIERS).toHaveProperty('growth');
    expect(PRICING_TIERS).toHaveProperty('pro');
  });

  it('should have correct starter tier pricing', () => {
    expect(PRICING_TIERS.starter.monthly).toBe(19);
    expect(PRICING_TIERS.starter.annual).toBe(182);
    expect(PRICING_TIERS.starter.annualSavings).toBe(46);
    expect(PRICING_TIERS.starter.collectionsLimit).toBe(10);
    expect(PRICING_TIERS.starter.teamMembers).toBe(1);
  });

  it('should have correct growth tier pricing', () => {
    expect(PRICING_TIERS.growth.monthly).toBe(39);
    expect(PRICING_TIERS.growth.annual).toBe(374);
    expect(PRICING_TIERS.growth.annualSavings).toBe(94);
    expect(PRICING_TIERS.growth.collectionsLimit).toBe(50);
    expect(PRICING_TIERS.growth.teamMembers).toBe(5);
  });

  it('should have correct pro tier pricing', () => {
    expect(PRICING_TIERS.pro.monthly).toBe(75);
    expect(PRICING_TIERS.pro.annual).toBe(720);
    expect(PRICING_TIERS.pro.annualSavings).toBe(180);
    expect(PRICING_TIERS.pro.collectionsLimit).toBeNull(); // Unlimited
    expect(PRICING_TIERS.pro.teamMembers).toBeNull(); // Unlimited
  });

  it('should have annual pricing at ~20% discount', () => {
    Object.entries(PRICING_TIERS).forEach(([tier, pricing]) => {
      const fullYearCost = pricing.monthly * 12;
      const discount = ((fullYearCost - pricing.annual) / fullYearCost) * 100;
      expect(discount).toBeGreaterThanOrEqual(19);
      expect(discount).toBeLessThanOrEqual(21);
    });
  });

  it('should have features array for each tier', () => {
    Object.values(PRICING_TIERS).forEach((pricing) => {
      expect(Array.isArray(pricing.features)).toBe(true);
      expect(pricing.features.length).toBeGreaterThan(0);
    });
  });
});

describe('getTierPrice', () => {
  it('should return monthly price by default', () => {
    expect(getTierPrice('starter')).toBe(19);
    expect(getTierPrice('growth')).toBe(39);
    expect(getTierPrice('pro')).toBe(75);
  });

  it('should return monthly price when isAnnual=false', () => {
    expect(getTierPrice('starter', false)).toBe(19);
    expect(getTierPrice('growth', false)).toBe(39);
    expect(getTierPrice('pro', false)).toBe(75);
  });

  it('should return annual price when isAnnual=true', () => {
    expect(getTierPrice('starter', true)).toBe(182);
    expect(getTierPrice('growth', true)).toBe(374);
    expect(getTierPrice('pro', true)).toBe(720);
  });
});

describe('getTierCollectionsLimit', () => {
  it('should return correct limits for each tier', () => {
    expect(getTierCollectionsLimit('starter')).toBe(10);
    expect(getTierCollectionsLimit('growth')).toBe(50);
    expect(getTierCollectionsLimit('pro')).toBeNull(); // Unlimited
  });
});

describe('getTierTeamMembersLimit', () => {
  it('should return correct team member limits', () => {
    expect(getTierTeamMembersLimit('starter')).toBe(1);
    expect(getTierTeamMembersLimit('growth')).toBe(5);
    expect(getTierTeamMembersLimit('pro')).toBeNull(); // Unlimited
  });
});

describe('getAnnualSavings', () => {
  it('should return correct annual savings', () => {
    expect(getAnnualSavings('starter')).toBe(46);
    expect(getAnnualSavings('growth')).toBe(94);
    expect(getAnnualSavings('pro')).toBe(180);
  });

  it('should calculate savings correctly', () => {
    const tiers: PricingTier[] = ['starter', 'growth', 'pro'];
    tiers.forEach((tier) => {
      const monthly = getTierPrice(tier, false);
      const annual = getTierPrice(tier, true);
      const expectedSavings = monthly * 12 - annual;
      expect(getAnnualSavings(tier)).toBe(expectedSavings);
    });
  });
});

describe('getMonthlyEquivalentPrice', () => {
  it('should return monthly equivalent of annual price', () => {
    expect(getMonthlyEquivalentPrice('starter')).toBe(15); // 182/12 = 15.17 rounded
    expect(getMonthlyEquivalentPrice('growth')).toBe(31); // 374/12 = 31.17 rounded
    expect(getMonthlyEquivalentPrice('pro')).toBe(60); // 720/12 = 60
  });
});

describe('mapLegacyTierToV3', () => {
  it('should map free to starter', () => {
    expect(mapLegacyTierToV3('free')).toBe('starter');
  });

  it('should map paid to growth', () => {
    expect(mapLegacyTierToV3('paid')).toBe('growth');
  });

  it('should map business to pro', () => {
    expect(mapLegacyTierToV3('business')).toBe('pro');
  });
});

describe('hasExceededCollectionsLimit', () => {
  it('should return false when under limit', () => {
    expect(hasExceededCollectionsLimit('starter', 5)).toBe(false);
    expect(hasExceededCollectionsLimit('growth', 30)).toBe(false);
  });

  it('should return true when at or over limit', () => {
    expect(hasExceededCollectionsLimit('starter', 10)).toBe(true);
    expect(hasExceededCollectionsLimit('starter', 15)).toBe(true);
    expect(hasExceededCollectionsLimit('growth', 50)).toBe(true);
    expect(hasExceededCollectionsLimit('growth', 60)).toBe(true);
  });

  it('should return false for unlimited tier (pro)', () => {
    expect(hasExceededCollectionsLimit('pro', 100)).toBe(false);
    expect(hasExceededCollectionsLimit('pro', 1000)).toBe(false);
    expect(hasExceededCollectionsLimit('pro', 999999)).toBe(false);
  });

  it('should handle edge case of exactly at limit', () => {
    expect(hasExceededCollectionsLimit('starter', 10)).toBe(true);
    expect(hasExceededCollectionsLimit('growth', 50)).toBe(true);
  });
});

describe('calculateOverageCost', () => {
  describe('Starter Tier', () => {
    it('should return 0 when under limit', () => {
      expect(calculateOverageCost('starter', 5)).toBe(0);
      expect(calculateOverageCost('starter', 9)).toBe(0);
    });

    it('should return 0 when exactly at limit', () => {
      expect(calculateOverageCost('starter', 10)).toBe(0);
    });

    it('should charge £2 per collection over limit', () => {
      expect(calculateOverageCost('starter', 11)).toBe(2); // 1 over × £2
      expect(calculateOverageCost('starter', 15)).toBe(10); // 5 over × £2
      expect(calculateOverageCost('starter', 20)).toBe(20); // 10 over × £2
    });
  });

  describe('Growth Tier', () => {
    it('should return 0 when under limit', () => {
      expect(calculateOverageCost('growth', 30)).toBe(0);
      expect(calculateOverageCost('growth', 49)).toBe(0);
    });

    it('should return 0 when exactly at limit', () => {
      expect(calculateOverageCost('growth', 50)).toBe(0);
    });

    it('should charge £1.50 per collection over limit', () => {
      expect(calculateOverageCost('growth', 51)).toBe(1.5); // 1 over × £1.50
      expect(calculateOverageCost('growth', 60)).toBe(15); // 10 over × £1.50
      expect(calculateOverageCost('growth', 70)).toBe(30); // 20 over × £1.50
    });
  });

  describe('Pro Tier', () => {
    it('should return 0 for unlimited tier', () => {
      expect(calculateOverageCost('pro', 100)).toBe(0);
      expect(calculateOverageCost('pro', 1000)).toBe(0);
      expect(calculateOverageCost('pro', 999999)).toBe(0);
    });
  });
});

describe('getRecommendedUpgrade', () => {
  describe('Starter Tier', () => {
    it('should recommend growth when using >80% of limit', () => {
      expect(getRecommendedUpgrade('starter', 8)).toBe('growth'); // 80%
      expect(getRecommendedUpgrade('starter', 9)).toBe('growth'); // 90%
      expect(getRecommendedUpgrade('starter', 10)).toBe('growth'); // 100%
    });

    it('should not recommend upgrade when under 80%', () => {
      expect(getRecommendedUpgrade('starter', 5)).toBeNull(); // 50%
      expect(getRecommendedUpgrade('starter', 7)).toBeNull(); // 70%
    });
  });

  describe('Growth Tier', () => {
    it('should recommend pro when using >80% of limit', () => {
      expect(getRecommendedUpgrade('growth', 40)).toBe('pro'); // 80%
      expect(getRecommendedUpgrade('growth', 45)).toBe('pro'); // 90%
      expect(getRecommendedUpgrade('growth', 50)).toBe('pro'); // 100%
    });

    it('should not recommend upgrade when under 80%', () => {
      expect(getRecommendedUpgrade('growth', 20)).toBeNull(); // 40%
      expect(getRecommendedUpgrade('growth', 35)).toBeNull(); // 70%
    });
  });

  describe('Pro Tier', () => {
    it('should not recommend upgrade for unlimited tier', () => {
      expect(getRecommendedUpgrade('pro', 100)).toBeNull();
      expect(getRecommendedUpgrade('pro', 1000)).toBeNull();
    });
  });
});

describe('calculateLTV', () => {
  it('should calculate LTV for monthly subscriptions', () => {
    // Monthly price × 12 months retention
    expect(calculateLTV('starter', false)).toBe(19 * 12); // £228
    expect(calculateLTV('growth', false)).toBe(39 * 12); // £468
    expect(calculateLTV('pro', false)).toBe(75 * 12); // £900
  });

  it('should calculate LTV for annual subscriptions with 1.5x retention', () => {
    // Annual price × 1.5 (longer retention)
    expect(calculateLTV('starter', true)).toBe(182 * 1.5); // £273
    expect(calculateLTV('growth', true)).toBe(374 * 1.5); // £561
    expect(calculateLTV('pro', true)).toBe(720 * 1.5); // £1080
  });

  it('should show higher LTV for higher tiers', () => {
    const starterLTV = calculateLTV('starter');
    const growthLTV = calculateLTV('growth');
    const proLTV = calculateLTV('pro');

    expect(growthLTV).toBeGreaterThan(starterLTV);
    expect(proLTV).toBeGreaterThan(growthLTV);
  });
});

describe('formatPrice', () => {
  it('should format whole numbers without pence by default', () => {
    expect(formatPrice(19)).toBe('£19');
    expect(formatPrice(39)).toBe('£39');
    expect(formatPrice(75)).toBe('£75');
  });

  it('should format decimal numbers with pence', () => {
    expect(formatPrice(19.99)).toBe('£19.99');
    expect(formatPrice(39.50)).toBe('£39.50');
    expect(formatPrice(75.01)).toBe('£75.01');
  });

  it('should show pence when showPence=true', () => {
    expect(formatPrice(19, true)).toBe('£19.00');
    expect(formatPrice(39, true)).toBe('£39.00');
    expect(formatPrice(75, true)).toBe('£75.00');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('£0');
    expect(formatPrice(0, true)).toBe('£0.00');
  });

  it('should handle large numbers', () => {
    expect(formatPrice(1000)).toBe('£1000');
    expect(formatPrice(1234.56)).toBe('£1234.56');
  });
});

describe('getAnnualDiscountPercentage', () => {
  it('should return approximately 20% discount for all tiers', () => {
    expect(getAnnualDiscountPercentage('starter')).toBe(20);
    expect(getAnnualDiscountPercentage('growth')).toBe(20);
    expect(getAnnualDiscountPercentage('pro')).toBe(20);
  });

  it('should calculate discount correctly', () => {
    const tiers: PricingTier[] = ['starter', 'growth', 'pro'];
    tiers.forEach((tier) => {
      const monthly = getTierPrice(tier, false);
      const annual = getTierPrice(tier, true);
      const fullYearCost = monthly * 12;
      const savings = fullYearCost - annual;
      const expectedDiscount = Math.round((savings / fullYearCost) * 100);

      expect(getAnnualDiscountPercentage(tier)).toBe(expectedDiscount);
    });
  });
});

describe('Integration and Real-World Scenarios', () => {
  it('should handle freelancer on starter plan approaching limit', () => {
    const tier: PricingTier = 'starter';
    const collectionsUsed = 8;

    const exceeded = hasExceededCollectionsLimit(tier, collectionsUsed);
    const overage = calculateOverageCost(tier, collectionsUsed);
    const upgrade = getRecommendedUpgrade(tier, collectionsUsed);

    expect(exceeded).toBe(false);
    expect(overage).toBe(0);
    expect(upgrade).toBe('growth'); // Recommend upgrade at 80%
  });

  it('should handle freelancer on starter plan over limit', () => {
    const tier: PricingTier = 'starter';
    const collectionsUsed = 15;

    const exceeded = hasExceededCollectionsLimit(tier, collectionsUsed);
    const overage = calculateOverageCost(tier, collectionsUsed);
    const upgrade = getRecommendedUpgrade(tier, collectionsUsed);

    expect(exceeded).toBe(true);
    expect(overage).toBe(10); // 5 over × £2 = £10
    expect(upgrade).toBe('growth');
  });

  it('should handle agency on growth plan', () => {
    const tier: PricingTier = 'growth';
    const collectionsUsed = 55;

    const exceeded = hasExceededCollectionsLimit(tier, collectionsUsed);
    const overage = calculateOverageCost(tier, collectionsUsed);
    const upgrade = getRecommendedUpgrade(tier, collectionsUsed);

    expect(exceeded).toBe(true);
    expect(overage).toBe(7.5); // 5 over × £1.50 = £7.50
    expect(upgrade).toBe('pro');
  });

  it('should handle enterprise on pro plan', () => {
    const tier: PricingTier = 'pro';
    const collectionsUsed = 500;

    const exceeded = hasExceededCollectionsLimit(tier, collectionsUsed);
    const overage = calculateOverageCost(tier, collectionsUsed);
    const upgrade = getRecommendedUpgrade(tier, collectionsUsed);

    expect(exceeded).toBe(false);
    expect(overage).toBe(0);
    expect(upgrade).toBeNull(); // No upgrade available
  });

  it('should correctly calculate annual savings value proposition', () => {
    // Starter tier: Save £46/year by paying annually
    const starterMonthlyCost = 19 * 12; // £228
    const starterAnnualCost = 182;
    expect(starterMonthlyCost - starterAnnualCost).toBe(46);

    // Growth tier: Save £94/year
    const growthMonthlyCost = 39 * 12; // £468
    const growthAnnualCost = 374;
    expect(growthMonthlyCost - growthAnnualCost).toBe(94);

    // Pro tier: Save £180/year
    const proMonthlyCost = 75 * 12; // £900
    const proAnnualCost = 720;
    expect(proMonthlyCost - proAnnualCost).toBe(180);
  });
});

describe('Edge Cases', () => {
  it('should handle zero collections used', () => {
    expect(hasExceededCollectionsLimit('starter', 0)).toBe(false);
    expect(calculateOverageCost('starter', 0)).toBe(0);
    expect(getRecommendedUpgrade('starter', 0)).toBeNull();
  });

  it('should handle exactly at limit boundary', () => {
    expect(hasExceededCollectionsLimit('starter', 10)).toBe(true);
    expect(calculateOverageCost('starter', 10)).toBe(0);
    expect(getRecommendedUpgrade('starter', 10)).toBe('growth');
  });

  it('should handle very high usage on unlimited tier', () => {
    expect(hasExceededCollectionsLimit('pro', 999999)).toBe(false);
    expect(calculateOverageCost('pro', 999999)).toBe(0);
  });
});
