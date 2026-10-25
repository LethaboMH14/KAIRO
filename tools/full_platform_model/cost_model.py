"""Full-vision illustrative pricing/capacity envelope, separate from shipped-slice forecast."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/business-canvas-20261024'
RATES={'usd_zar_budget':20,'vendor_tax_reserve':.15,'llm_bundle_usd':.00932,
 'layout_usd_page':.01,'stt_usd_minute':.016,'translation_usd_million_chars':20,
 'tts_usd_million_chars':30,'card_percent':.032,'card_fixed_zar':2,'vat':.15}
def active_cost(lessons=4,pages=20,listen_minutes=10,translated_chars=5000,voice_chars=2500,
                target_languages=1,support_minutes=2,fx=20,duplicate=1.1):
    r=RATES
    parts_usd={'lesson_and_help':lessons*r['llm_bundle_usd']*duplicate,
      'complex_pdf_layout':pages*r['layout_usd_page'],
      'listening':listen_minutes*r['stt_usd_minute'],
      'text_translation':translated_chars*target_languages/1e6*r['translation_usd_million_chars'],
      'premium_narration':voice_chars/1e6*r['tts_usd_million_chars']*duplicate,
      'embedding_budget':.01,'retrieval_query_budget':.03,'vision_reasoning_budget':.05,
      'infrastructure_budget':.10}
    # Duplicate factor covers generation/synthesis; page/minute retry amplifications are separately stressed.
    parts={k:v*fx*(1+r['vendor_tax_reserve']) for k,v in parts_usd.items()}
    parts['support']=support_minutes/60*120
    return parts
def consumer(parts,price=49):
    net=price*.97/1.15
    fee=(price*.032+2+.03*2)*1.15
    return {'gross_price':price,'net_revenue':net,'service_cost':sum(parts.values()),'fees':fee,
            'contribution':net-sum(parts.values())-fee}
def result():
    student=active_cost();institution=active_cost(support_minutes=1)
    employee=active_cost(lessons=8,pages=20,listen_minutes=30,translated_chars=20000,voice_chars=8000,support_minutes=5)
    allocations={'engineering_product':35000,'ai_backend':35000,'frontend_3d':30000,
      'educational_review':15000,'language_sasl_review':15000,'qa_security_operations':10000}
    overhead={'baseline_cloud_staging_monitoring':6000,'development_tools':3000,
      'legal_privacy_insurance_reserve':6000,'sales_marketing':10000,'devices_connectivity':2000,
      'data_rights_source_curation':3000}
    salary=sum(allocations.values());fixed=salary*1.2+sum(overhead.values())
    development={'profile_evidence_adaptation':160,'role_skill_alignment':80,'opportunity_freshness':100,
      'multimodal_review_pipeline':120,'listening_language_flow':80,'bounded_signed_learning':100,
      'tenant_payment_security':120,'acceptance_release':80}
    project={'engineering_60h_at350':21000,'instructional_design_24h_at250':6000,
      'domain_review_20h_at450':9000,'qa_accessibility_16h_at250':4000}
    direct=sum(project.values());project_quote=direct*1.25/.7
    ic=59-.6*sum(institution.values());ec=149-.8*sum(employee.values())
    mixes=[]
    for n,cp,is_,es,free in [('Small paid footprint',200,1000,100,1000),('Illustrative larger footprint',500,5000,500,2000)]:
      c=consumer(student)
      revenue=cp*c['net_revenue']+is_*59+es*149
      cost=cp*(c['service_cost']+c['fees'])+is_*.6*sum(institution.values())+es*.8*sum(employee.values())+free*1.25+fixed
      mixes.append({'name':n,'consumer_payers':cp,'institution_licensed':is_,'employee_licensed':es,'free_active':free,
        'recurring_revenue_ex_vat':revenue,'expense_incl_fixed':cost,'operating_before_tax':revenue-cost})
    data=dict(basis='Illustrative full-vision service envelope; not shipped entitlements, quote, demand forecast or all-in final budget.',
      rates=RATES,student_active_parts=student,institution_active_parts=institution,employee_active_parts=employee,
      consumer_full_usage=consumer(student),institution_seat_contribution=ic,employee_seat_contribution=ec,
      institution_core_annual_250_seats_ex_vat=250*35*12,institution_core_setup=6000,
      institution_connected_annual_250_seats_ex_vat=250*59*12,institution_connected_setup=15000,
      company_annual_50_seats_ex_vat=50*149*12,company_setup=15000,
      monthly_team_allocations=allocations,employment_load_reserve=.2,monthly_overhead=overhead,fixed_monthly=fixed,
      development_hours=development,development_loaded_hour=300,development_risk=.25,
      development_cost_envelope=sum(development.values())*300*1.25,
      custom_training_project_costs=project,custom_training_direct=direct,custom_training_contingency=.25,
      custom_training_target_margin=.3,custom_training_quote_ex_vat=project_quote,
      break_even_lower_bounds={'consumer_full_usage':math.ceil(fixed/consumer(student)['contribution']),
       'institution_licensed':math.ceil(fixed/ic),'employee_licensed':math.ceil(fixed/ec)},
      mixed_run_rates=mixes,stress={})
    for name,args in {'Heavy 200-page month':{'pages':200},'Sixty minutes listening':{'listen_minutes':60},
      'Ten language fanout':{'target_languages':10},'Premium voice 80000 characters':{'voice_chars':80000},
      'FX26 and duplicate calls':{'fx':26,'duplicate':2}}.items():
      data['stress'][name]=consumer(active_cost(**args))
    assert abs(sum(student.values())-21.790684)<1e-6
    assert fixed==198000 and data['development_cost_envelope']==315000
    assert data['stress']['Heavy 200-page month']['contribution']<0
    assert data['stress']['Premium voice 80000 characters']['contribution']<0
    assert data['company_annual_50_seats_ex_vat']==89400
    assert abs(project_quote-direct*1.25/(1-.3))<1e-6
    data['checks']='PASS: service sum, annual fees, team budget, hours, negative heavy-use margin, custom quote margin.'
    return data
if __name__=='__main__':
    data=result();OUT.mkdir(exist_ok=True)
    (OUT/'full-platform-results.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    print(json.dumps({k:data[k] for k in ['consumer_full_usage','institution_seat_contribution','employee_seat_contribution','fixed_monthly','development_cost_envelope','custom_training_quote_ex_vat','mixed_run_rates','checks']},indent=2))
