"""KAIRO driver-based planning, not a calibrated demand prediction. Python stdlib."""
import csv, json, math, random, statistics
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/business-canvas-20261024'
# Every value below is a planning assumption except explicit provider/tax rates.
DRIVERS = [
 ('reach_start',250,120,400,'Qualified people reached in month 1; unvalidated'),
 ('reach_growth',.12,.04,.16,'Monthly reach growth; not observed'),
 ('activation',.25,.15,.35,'Reach to activated user; not observed'),
 ('conversion',.08,.04,.12,'Activated to paid; not observed'),
 ('churn',.07,.12,.045,'Monthly paid account churn; not observed'),
 ('free_retention',.35,.25,.4,'Monthly free account retention; not observed'),
 ('first_contract',6,9,4,'First hypothetical cohort starts; month index'),
 ('contract_interval',3,6,2,'Months between hypothetical new contracts'),
 ('renewal',1,.5,1,'Expected annual seat renewal fraction'),
 ('payment_lag',1,3,1,'Whole months after institution invoice'),
 ('seats',250,250,250,'Seats per contract; proposed minimum'),
 ('seat_price',35,35,35,'R per licensed seat/month excluding VAT; hypothesis'),
 ('onboarding_price',6000,6000,6000,'R once per new cohort excluding VAT; hypothesis'),
 ('fx',20,24,18,'R/USD budgeting rate; not a spot quote'),
 ('lessons',4,6,4,'Paid completed lesson/help bundles per month; hypothesis'),
 ('voice_chars',2500,8000,2500,'Premium characters per paid active month; cap hypothesis 8000'),
 ('inst_active',.6,.8,.65,'Monthly active fraction of licensed seats; assumption'),
 ('free_lessons',.25,.5,.25,'Cloud lesson bundles per free active month; quota hypothesis'),
 ('support_minutes',2,5,2,'Support minutes per consumer paid month; assumption'),
 ('support_hour',120,120,120,'R/hour fully loaded contractor support budget, not wage data'),
 ('retry_multiplier',1.1,1.5,1.1,'Billable duplicate successful requests; not failed HTTP calls'),
 ('marketing',2500,2500,4000,'R/month separate acquisition budget; assumption'),
 ('sales_cost',8000,10000,8000,'R/new institution cohort; sales/procurement cash budget'),
 ('onboarding_cost',4000,5000,4000,'R/new cohort domain setup/review labour budget'),
 ('fixed_cash',15000,15000,22000,'R/month: QA 8000/12000, ops 4000/6000, security reserve 3000/4000'),
 ('founder_replacement',30000,30000,35000,'R/month economic replacement labour, not observed salary'),
 ('refund_rate',.03,.06,.03,'Consumer receipts refunded; no original fee rebate assumed'),
 ('initial_setup',25000,25000,35000,'R initial device/legal/setup budget; no credit assumed'),
 ('vat',.15,.15,.15,'SARS standard rate; conservative registered-vendor planning, not actual registration'),
 ('llm_bundle_usd',.00932,.00932,.00932,'Standard Global token budget, dated 2026-10-24; see rates register'),
 ('tts_usd_million',30,30,30,'Google Chirp 3 HD after allowance; no free credits assumed'),
 ('infra_paid_usd',.10,.15,.10,'PROVISIONAL all-in variable OCR/auth/storage/egress/DB/log reserve per active month'),
 ('infra_free_usd',.03,.05,.03,'PROVISIONAL free active user infrastructure reserve'),
 ('pay_pct',.032,.032,.032,'Payfast domestic card rate, excluding VAT'),
 ('pay_fixed',2,2,2,'R per successful consumer card charge, excluding VAT'),
 ('refund_fee',2,2,2,'R per refund, excluding VAT'),
 ('payout_fee',8.70,8.70,8.70,'R once/month settlement budget excluding VAT'),
 ('price',49,49,49,'R/month consumer VAT inclusive if registered; hypothesis'),
 ('cloud_tax_reserve',.15,.15,.15,'Provisional vendor/import tax reserve on USD services; no input credit reclaimed'),
 ('vat_registered',1,1,1,'Planning vendor registration flag 1/0; NOT a statement of actual registration'),
]
CASES = {n:{d[0]:d[i+1] for d in DRIVERS} for i,n in enumerate(('Base','Downside','Upside'))}

def units(p):
    fee=(p['price']*p['pay_pct']+p['pay_fixed']+p['refund_rate']*p['refund_fee'])*(1+p['vat'])
    landed=p['fx']*(1+p['cloud_tax_reserve'])
    llm=p['lessons']*p['llm_bundle_usd']*p['retry_multiplier']*landed
    voice=p['voice_chars']/1e6*p['tts_usd_million']*p['retry_multiplier']*landed
    infra=p['infra_paid_usd']*landed
    support=p['support_minutes']/60*p['support_hour']
    consumer=llm+voice+infra+support+fee
    free=p['free_lessons']*p['llm_bundle_usd']*p['retry_multiplier']*landed+p['infra_free_usd']*landed+.25/60*p['support_hour']
    # Institution active learner: two lesson bundles, same average voice, one support minute.
    inst=2*p['llm_bundle_usd']*p['retry_multiplier']*landed+voice+infra+1/60*p['support_hour']
    net=p['price']*(1-p['refund_rate'])/(1+p['vat']*p['vat_registered'])
    return dict(net_consumer=net,consumer_cost=consumer,consumer_contribution=net-consumer,
                fee=fee,llm=llm,voice=voice,infra=infra,support=support,free_cost=free,
                inst_active_cost=inst,inst_contribution=p['seat_price']-p['inst_active']*inst)

def forecast(p, events=None):
    u=units(p); rows=[]; paid=free=licensed=ar=deferred=cash=0.
    for m in range(1,25):
        # Month 1 is November 2026. December/June exams and January/July vacation are stress assumptions.
        calendar=(9+m)%12+1
        season={12:.65,1:.65,6:.85,7:.85}.get(calendar,1.)
        reach=p['reach_start']*(1+p['reach_growth'])**(m-1)
        newpaid=reach*season*p['activation']*p['conversion']
        retained=paid*(1-p['churn'])
        newcontracts=(float(m>=p['first_contract'] and (m-p['first_contract'])%p['contract_interval']==0)
                      if events is None else events.get(m,0.))
        old=rows[m-13] if m>12 else None
        expires=old['new_contracts'] if old else 0.
        renew=expires*p['renewal']
        licensed+=p['seats']*(newcontracts-expires+renew)
        migrate=min(retained+newpaid,newcontracts*p['seats']*.15)
        paid=retained+newpaid-migrate
        free=max(0,free*p['free_retention']+reach*season*p['activation']*(1-p['conversion'])-newcontracts*p['seats']*.5)
        active=licensed*p['inst_active']
        consumer_rev=paid*u['net_consumer']; inst_rev=licensed*p['seat_price']
        onboard_rev=newcontracts*p['onboarding_price']; revenue=consumer_rev+inst_rev+onboard_rev
        variable=paid*u['consumer_cost']+free*u['free_cost']+active*u['inst_active_cost']
        # Failed scheduled sales attempts still consume sales/procurement budget in Monte Carlo.
        attempts=newcontracts if events is None else float(m in events)
        acq=p['marketing']+attempts*p['sales_cost']+newcontracts*p['onboarding_cost']
        payout=p['payout_fee']*(1+p['vat']) if paid>0 else 0
        economic_fixed=p['fixed_cash']+p['founder_replacement']
        draw=0 if m<=3 else 15000 if m<=6 else 25000 if m<=12 else p['founder_replacement']
        cash_fixed=p['fixed_cash']+draw
        op=revenue-variable-acq-economic_fixed-payout
        invoice=(newcontracts+renew)*p['seats']*p['seat_price']*12+onboard_rev
        lag=int(p['payment_lag']); collected=invoice if lag==0 else rows[m-lag-1]['invoice'] if m>lag else 0
        ar+=invoice-collected
        deferred+=(newcontracts+renew)*p['seats']*p['seat_price']*12-inst_rev
        vat_float=(collected-invoice)*p['vat']*p['vat_registered'] # consumer VAT already removed above
        delta=consumer_rev+collected+vat_float-variable-acq-cash_fixed-payout-(p['initial_setup'] if m==1 else 0)
        cash+=delta
        rows.append(dict(month=m,reach=reach,season=season,new_paid=newpaid,retained=retained,migrated=migrate,
            paid=paid,free=free,new_contracts=newcontracts,renew_contracts=renew,licensed=licensed,active=active,
            consumer_rev=consumer_rev,inst_rev=inst_rev,onboard_rev=onboard_rev,revenue=revenue,
            variable=variable,acquisition=acq,economic_fixed=economic_fixed,payout=payout,operating=op,
            invoice=invoice,collected=collected,receivables=ar,deferred=deferred,cash_fixed=cash_fixed,
            vat_timing=vat_float,cash_delta=delta,cumulative_cash=cash))
    return rows

def summary(rows):
    return dict(month24_paid=rows[-1]['paid'],month24_seats=rows[-1]['licensed'],
                month24_revenue=rows[-1]['revenue'],month24_operating=rows[-1]['operating'],
                year1_revenue=sum(r['revenue'] for r in rows[:12]),year2_revenue=sum(r['revenue'] for r in rows[12:]),
                funding_need=max(0,-min(r['cumulative_cash'] for r in rows)),
                funding_with_20pct_buffer=max(0,-min(r['cumulative_cash'] for r in rows))*1.2,
                cash24=rows[-1]['cumulative_cash'],receivables24=rows[-1]['receivables'],deferred24=rows[-1]['deferred'],
                first_operating_positive=next((r['month'] for r in rows if r['operating']>=0),None))

def checks(p,rs):
    for i,r in enumerate(rs):
        assert min(r['paid'],r['free'],r['licensed'],r['deferred'],r['receivables'])>=-1e-7
        assert abs(r['revenue']-r['consumer_rev']-r['inst_rev']-r['onboard_rev'])<1e-7
        prev=rs[i-1] if i else dict(receivables=0,deferred=0,cumulative_cash=0)
        assert abs(r['receivables']-prev['receivables']-r['invoice']+r['collected'])<1e-6
        assert abs(r['deferred']-prev['deferred']-(r['new_contracts']+r['renew_contracts'])*p['seats']*p['seat_price']*12+r['inst_rev'])<1e-6
        assert abs(r['cumulative_cash']-prev['cumulative_cash']-r['cash_delta'])<1e-6
    assert abs((.3*7900+2.5*2780)/1e6-.00932)<1e-12
    return True

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    result={'basis':'Hypotheses; no actual demand/revenue. Operating before income tax, debt interest and distributions.',
            'drivers':[dict(key=d[0],base=d[1],downside=d[2],upside=d[3],note=d[4]) for d in DRIVERS], 'cases':{}}
    for name,p in CASES.items():
        rs=forecast(p);checks(p,rs)
        result['cases'][name]={'inputs':p,'units':units(p),'summary':summary(rs)}
        with (OUT/f'{name.lower()}-forecast.csv').open('w',newline='') as f:
            w=csv.DictWriter(f,fieldnames=rs[0].keys());w.writeheader();w.writerows(rs)
    stresses={
        'No demand':dict(reach_start=0,first_contract=99),
        'No institution contract':dict(first_contract=99),
        'Six month collection delay':dict(payment_lag=6),
        'Free heavy / slow paid conversion':dict(conversion=.02,free_retention=.8,free_lessons=1),
        'Voice cap used every month':dict(voice_chars=8000),
        'Uncapped voice 80000 chars':dict(voice_chars=80000),
        'FX and duplicate billing shock':dict(fx=26,retry_multiplier=2),
        'No institutional renewals':dict(renewal=0),
        'Double support / fixed labour':dict(support_minutes=4,fixed_cash=30000,founder_replacement=60000),
        'High churn':dict(churn=.18),
        'Unregistered vendor (eligibility unverified)':dict(vat_registered=0),
        'Single 20-seat price-test pilot':dict(seats=20,first_contract=6,contract_interval=99),
        'Single 40-seat price-test pilot':dict(seats=40,first_contract=6,contract_interval=99),
        'Single 60-seat price-test pilot':dict(seats=60,first_contract=6,contract_interval=99),
    }
    result['stress']={}
    for n,overrides in stresses.items():
        p=CASES['Base']|overrides;rs=forecast(p);checks(p,rs)
        result['stress'][n]=summary(rs)|{'consumer_contribution':units(p)['consumer_contribution']}
    rng=random.Random(20261024); samples=[]
    for _ in range(5000):
        p=CASES['Base'].copy(); common=rng.random()
        p.update(activation=rng.triangular(.12,.4,.25),conversion=rng.triangular(.02,.14,.08),
          churn=rng.triangular(.04,.18,.08),fx=rng.triangular(17,26,20),
          voice_chars=rng.triangular(1000,8000,2500),support_minutes=rng.triangular(1,6,2),
          payment_lag=rng.choice([1,1,2,3,6]),renewal=rng.triangular(.5,1,.9),
          reach_growth=rng.triangular(.02,.17,.1),retry_multiplier=rng.triangular(1,2,1.1))
        # Shared weak-market shock links weaker conversion, churn and lower institution wins.
        if common<.3:p['conversion']*=.6;p['churn']=min(.3,p['churn']*1.3)
        events={m:float(rng.random()<(0.4 if common<.3 else .8)) for m in range(6,25,3)}
        samples.append(summary(forecast(p,events))|dict(run=len(samples)+1,conversion=p['conversion'],
          activation=p['activation'],churn=p['churn'],fx=p['fx'],voice_chars=p['voice_chars'],
          support_minutes=p['support_minutes'],reach_growth=p['reach_growth'],renewal=p['renewal'],
          payment_lag=p['payment_lag'],retry_multiplier=p['retry_multiplier'],won_contracts=sum(events.values())))
    def quant(k,q):
        x=sorted(s[k] for s in samples);return x[round((len(x)-1)*q)]
    result['monte_carlo']={'seed':20261024,'runs':5000,'interpretation':'Conditional on arbitrary planning priors; not probability of commercial success.',
      'funding_need':{f'p{int(q*100)}':quant('funding_need',q) for q in [.1,.5,.9]},
      'month24_operating':{f'p{int(q*100)}':quant('month24_operating',q) for q in [.1,.5,.9]},
      'negative_month24_fraction':sum(s['month24_operating']<0 for s in samples)/len(samples)}
    result['checks']={'case_and_stress_reconciliations':'PASS','monte_carlo_runs':5000,
      'zero_demand_revenue':result['stress']['No demand']['year1_revenue'],
      'rate_arithmetic':'PASS: 0.00932 USD/bundle; premium speech separate'}
    with (OUT/'monte-carlo-draws.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=samples[0].keys());w.writeheader();w.writerows(samples)
    (OUT/'model-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    (Path(__file__).parent/'assumptions.json').write_text(json.dumps({'drivers':result['drivers']},indent=2),encoding='utf-8')
    print(json.dumps({n:d['summary'] for n,d in result['cases'].items()},indent=2))
    print(json.dumps(result['monte_carlo'],indent=2));print('CHECKS PASS')

if __name__=='__main__':main()
