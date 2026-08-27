#!/usr/bin/env python3
import sys,re,yaml,hashlib
from pathlib import Path
base=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent
srs_p=base/'SRS_2.4.1.yaml'; sad_p=base/'SAD_2.4.1.yaml'
errs=[]; warns=[]
try:
    s=yaml.safe_load(srs_p.read_text()); d=yaml.safe_load(sad_p.read_text())
except Exception as e:
    print('errors=1\nPARSE',e); sys.exit(1)
if s['metadata']['version']!='2.4.1' or d['metadata']['version']!='2.4.1': errs.append('version mismatch')
if s['metadata']['status']!='approved-implementation-baseline' or d['metadata']['status']!='approved-implementation-baseline': errs.append('status not approved-implementation-baseline')
if s['metadata']['companion_document']!='SAD_2.4.1.yaml' or d['metadata']['companion_document']!='SRS_2.4.1.yaml': errs.append('companion mismatch')
# Requirements / ACs / traceability
reqs=[r for items in s['requirements'].values() for r in items]
ids=[r['id'] for r in reqs]; reqset=set(ids)
if len(ids)!=len(reqset): errs.append('duplicate requirement ids')
acs=s['acceptance_criteria']; acids=[a['id'] for a in acs]; acset=set(acids)
if len(acids)!=len(acset): errs.append('duplicate AC ids')
for a in acs:
    for rid in a.get('requirement_ids',[]):
        if rid not in reqset: errs.append(f'AC {a["id"]} unknown req {rid}')
for rid,alist in s['traceability'].items():
    if rid not in reqset: errs.append(f'trace unknown req {rid}')
    for aid in alist:
        if aid not in acset: errs.append(f'trace {rid} unknown AC {aid}')
for rid in reqset:
    if rid not in s['traceability'] or not s['traceability'][rid]: errs.append(f'missing trace {rid}')
# SAD coverage
cov=d['verification_architecture']['satisfies']
for rid in reqset:
    if rid not in cov or not cov[rid]: errs.append(f'no SAD coverage {rid}')
for rid in cov:
    if rid not in reqset: errs.append(f'SAD coverage unknown req {rid}')
adrids={a['id'] for a in d['architectural_decisions']}
for rid,refs in cov.items():
    for ref in refs:
        if ref not in adrids: errs.append(f'{rid} bad ADR {ref}')
# Requirement IDs referenced in prose
blob=srs_p.read_text()+"\n"+sad_p.read_text()
for m in re.finditer(r'\b(?:CON|FR|HUE|TPL|UX-DEL|UX-VIS|DATA|PRIV|SEC|REL|QA)-\d{3}\b', blob):
    if m.group(0) not in reqset: errs.append(f'broken requirement ref {m.group(0)}')

# 2.4.1 SAD schema/risk hygiene
expected_sad_top_level = {
    'metadata','decision_guardrails','architectural_drivers','architecture_overview','selected_platform',
    'architectural_decisions','runtime_components','internal_domain_interfaces','hue_v1_design',
    'supported_resource_semantics','plug_protocol_design','state_and_concurrency','state_machines',
    'failure_and_deadline_architecture','persistence_architecture','preseed_architecture',
    'configuration_defaults_overlay_architecture','security_architecture','android_network_configuration',
    'startup_and_readiness','shutdown_and_backgrounding','logging_and_diagnostics','repository_structure',
    'verification_architecture','implementation_constraints','accepted_architectural_risks','baseline_issues',
    'open_architecture_questions','adversarial_review_checklist','baseline_readiness','architecture_sources',
}
unknown_sad_sections = sorted(set(d) - expected_sad_top_level)
if unknown_sad_sections: errs.append('unknown SAD top-level sections: '+','.join(unknown_sad_sections))
if 'risks' in d: errs.append('SAD risks must be under accepted_architectural_risks; top-level risks is forbidden')
accepted_risks = d.get('accepted_architectural_risks')
if not isinstance(accepted_risks, list):
    errs.append('accepted_architectural_risks must be a list')
    accepted_risks = []
risk_ids = [r.get('id') for r in accepted_risks if isinstance(r, dict)]
if len(risk_ids) != len(set(risk_ids)): errs.append('duplicate architectural risk ids')
for risk_id in risk_ids:
    if not isinstance(risk_id, str) or not re.fullmatch(r'RISK-\d{3}', risk_id): errs.append(f'invalid architectural risk id {risk_id!r}')
if 'RISK-009' not in risk_ids: errs.append('RISK-009 missing from accepted_architectural_risks')
accepted_risk_blob = '\n'.join(str(r) for r in accepted_risks)
known_guardrails = {x['id'] for x in s['decision_guardrails']['locked_decisions']}
for guardrail_id in re.findall(r'\bDG-\d{3}\b', accepted_risk_blob):
    if guardrail_id not in known_guardrails: errs.append(f'architectural risk references unknown guardrail {guardrail_id}')
for req_id in re.findall(r'\b(?:CON|FR|HUE|TPL|UX-DEL|UX-VIS|DATA|PRIV|SEC|REL|QA)-\d{3}\b', accepted_risk_blob):
    if req_id not in reqset: errs.append(f'architectural risk references unknown requirement {req_id}')

# Guardrails
locked={x['id']:x['decision'] for x in s['decision_guardrails']['locked_decisions']}
for x in ['DG-001','DG-002','DG-003','DG-004','DG-005','DG-006','DG-007']:
    if x not in locked: errs.append(f'missing guardrail {x}')
if 'explicit stakeholder requirement revision' not in s['decision_guardrails']['change_control']:
    errs.append('guardrail change control missing')
if 'household convenience workflow' not in locked['DG-007'].lower(): errs.append('DG-007 household dimmer simplification missing')
# Existing simplification architecture remains selected
if 'operational_recovery_state' not in s['persistent_state_contract'] or not str(s['persistent_state_contract']['operational_recovery_state']).lower().startswith('none required'):
    errs.append('operational recovery state not explicitly none')
if 'sqlite' in str(d.get('selected_platform',{})).lower(): errs.append('SQLite still selected platform')
if 'sqlite' in str(d.get('persistence_architecture',{})).lower(): errs.append('SQLite still selected persistence')
if d['persistence_architecture']['technology'].lower().find('asyncstorage')<0: errs.append('AsyncStorage not selected')
if len(d['runtime_components'])>12: warns.append(f'runtime component count high: {len(d["runtime_components"])}')
# 2.1/2.2 contracts stay intact
low=blob.lower()
for text in ['post /api','safeareaprovider','current diagnostic map','@rcaferati/react-native-awesome-button']:
    if text not in low: errs.append('prior baseline contract missing: '+text)
for rid in ['REL-008','UX-VIS-001','UX-VIS-002']:
    if rid not in reqset: errs.append('prior requirement missing: '+rid)
# Full Hue management not weakened
for rid in ['HUE-004','HUE-005','HUE-006','HUE-007','HUE-008','HUE-009','HUE-010']:
    r=next(x for x in reqs if x['id']==rid)
    if 'provide applicable' not in r['statement'].lower(): errs.append('full management weakened '+rid)
if 'documented v1' not in d['hue_v1_design']['full_management_strategy'].lower(): errs.append('full management catalog not explicit')
# 2.4 dimmer usability contract
for rid in ['HUE-021','HUE-022']:
    if rid not in reqset: errs.append('dimmer requirement missing: '+rid)
for aid in ['AC-HUE-021','AC-HUE-022']:
    if aid not in acset: errs.append('dimmer acceptance missing: '+aid)
h21=next(r['statement'] for r in reqs if r['id']=='HUE-021').lower()
h22=next(r['statement'] for r in reqs if r['id']=='HUE-022').lower()
for text in ['configure dimmer','physical control and gesture','advanced section']:
    if text not in h21: errs.append('HUE-021 missing household UX: '+text)
for text in ['simple_dimmer_edit','saved directly','structural_dimmer_edit','concise list']:
    if text not in h22: errs.append('HUE-022 missing simplified edit contract: '+text)
adr22=next(a for a in d['architectural_decisions'] if a['id']=='ADR-022')
adr22_blob=(adr22['decision']+' '+adr22['rationale']).lower()
for text in ['dimmereditormodel','one existing rule update','dimmerchangeset','household controller']:
    if text not in adr22_blob: errs.append('ADR-022 missing simplified mechanism: '+text)
# Old selected generalized machinery must not remain in active type/service architecture.
types=d['internal_domain_interfaces']['types']; services=d['internal_domain_interfaces']['services']
for key in ['HueAutomationGraph','DimmerProfile','DimmerMutationPlan']:
    if key in types: errs.append('old generalized dimmer type still selected: '+key)
for key in ['HueAutomationProjector','DimmerMutationPlanner']:
    if key in services: errs.append('old generalized dimmer service still selected: '+key)
for key in ['DimmerEditorModel','DimmerChangeSet']:
    if key not in types: errs.append('new dimmer type missing: '+key)
if 'DimmerEditing' not in services: errs.append('DimmerEditing service interface missing')
# Simple edits must not require owner confirmation/fingerprints.
if 'shall not require a separate mutation preview' not in h22: errs.append('simple-edit no-preview contract missing')
if 'additional confirmation solely because the rule was created by another bridge client' not in h22: errs.append('owner-confirmation simplification missing')
# Structural edits still retain safety.
if 'ux-del-001 through ux-del-003' not in h22: errs.append('structural delete confirmation reference missing')
if 'shall stop issuing dependent operations' not in h22: errs.append('structural failure stop rule missing')
# Fixture/target acceptance is explicit rather than pretending deployed fixture already exists.
ac21=next(a['criterion'] for a in acs if a['id']=='AC-HUE-021').lower()
if 'sanitized fixture captured from the household dimmer during implementation acceptance' not in ac21:
    errs.append('household dimmer target characterization acceptance missing')
# Baseline status/readiness
if s.get('baseline_issues'): errs.append('SRS baseline issues not empty')
if d.get('baseline_issues'): errs.append('SAD baseline issues not empty')
if s['baseline_readiness']['status']!='approved-implementation-baseline': errs.append('SRS readiness status mismatch')
if d['baseline_readiness']['status']!='approved-implementation-baseline': errs.append('SAD readiness status mismatch')
# Evidence hash if fixture bundle co-located
expected=s['baseline_evidence']['sha256']; ep=base/s['baseline_evidence']['fixture_bundle']
if ep.exists():
    got=hashlib.sha256(ep.read_bytes()).hexdigest()
    if got!=expected: errs.append(f'evidence sha mismatch {got}')
print(f'requirements={len(reqs)}')
print(f'acceptance={len(acs)}')
print(f'sad_covered_requirements={sum(1 for r in reqset if r in cov and cov[r])}')
print(f'runtime_components={len(d["runtime_components"])}')
print(f'architectural_decisions={len(d["architectural_decisions"])}')
print(f'errors={len(set(errs))}')
print(f'warnings={len(set(warns))}')
for e in sorted(set(errs)): print('ERROR:',e)
for w in sorted(set(warns)): print('WARNING:',w)
sys.exit(1 if errs else 0)
