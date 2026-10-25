import unittest
from model import CASES, forecast, units, checks

class EconomicChecks(unittest.TestCase):
    def setUp(self): self.p=CASES['Base'].copy()
    def test_calendar_regression(self):
        rs=forecast(self.p)
        self.assertEqual([r['season'] for r in rs[:9]],[1,.65,.65,1,1,1,1,.85,.85])
    def test_zero_demand_has_no_revenue(self):
        rs=forecast(self.p|{'reach_start':0,'first_contract':99})
        self.assertEqual(sum(r['revenue'] for r in rs),0)
        self.assertEqual(rs[-1]['cumulative_cash'],-1000000)
    def test_seven_cohorts_three_renewals_not_ten_new_customers(self):
        rs=forecast(self.p)
        self.assertEqual(sum(r['new_contracts'] for r in rs),7)
        self.assertEqual(sum(r['renew_contracts'] for r in rs),3)
        self.assertEqual(rs[-1]['licensed'],1750)
    def test_annual_cash_is_not_month_one_earned_revenue(self):
        r=forecast(self.p)[5]
        self.assertEqual(r['invoice'],111000)
        self.assertEqual(r['inst_rev'],8750)
        self.assertEqual(r['deferred'],96250)
        self.assertEqual(r['collected'],0)
    def test_sponsorship_removes_consumer_charge(self):
        rs=forecast(self.p);r=rs[5]
        self.assertAlmostEqual(r['migrated'],r['new_paid']+r['retained'])
        self.assertEqual(r['consumer_rev'],0)
    def test_no_renewal_removes_expiring_seats(self):
        rs=forecast(self.p|{'renewal':0})
        self.assertEqual(rs[-1]['licensed'],1000)
    def test_delay_changes_cash_not_earned_revenue(self):
        a,b=forecast(self.p),forecast(self.p|{'payment_lag':6})
        self.assertEqual(sum(r['revenue'] for r in a),sum(r['revenue'] for r in b))
        self.assertLess(b[-1]['cumulative_cash'],a[-1]['cumulative_cash'])
    def test_payment_vat_and_refund_fee(self):
        self.assertAlmostEqual(units(self.p)['fee'],(49*.032+2+.03*2)*1.15)
    def test_unlimited_voice_can_destroy_margin(self):
        self.assertLess(units(self.p|{'voice_chars':80000})['consumer_contribution'],0)
    def test_no_premium_voice_removes_only_voice(self):
        a,b=units(self.p),units(self.p|{'voice_chars':0})
        self.assertAlmostEqual(a['consumer_cost']-b['consumer_cost'],a['voice'])
        self.assertGreater(b['consumer_cost'],0)
    def test_free_is_not_costless(self): self.assertGreater(units(self.p)['free_cost'],0)
    def test_no_institution_never_invoices(self):
        rs=forecast(self.p|{'first_contract':99})
        self.assertEqual(sum(r['invoice'] for r in rs),0)
    def test_all_case_rollforwards(self):
        for p in CASES.values():self.assertTrue(checks(p,forecast(p)))
    def test_immediate_collection_no_institution_vat_float(self):
        rs=forecast(self.p|{'payment_lag':0})
        self.assertTrue(all(r['receivables']==0 and r['vat_timing']==0 for r in rs))
    def test_failed_sales_attempt_still_costs_money(self):
        rs=forecast(self.p,events={6:0})
        self.assertEqual(rs[5]['invoice'],0)
        self.assertEqual(rs[5]['acquisition'],10500)
    def test_unregistered_does_not_remove_supplier_fee_vat(self):
        a,b=units(self.p),units(self.p|{'vat_registered':0})
        self.assertEqual(a['fee'],b['fee'])
        self.assertAlmostEqual(b['net_consumer'],49*.97)
        self.assertTrue(all(r['vat_timing']==0 for r in forecast(self.p|{'vat_registered':0})))

if __name__=='__main__':unittest.main()
