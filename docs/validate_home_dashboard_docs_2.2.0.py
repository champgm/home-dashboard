#!/usr/bin/env python3
import sys,re,yaml,hashlib,os
from pathlib import Path
base=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parent
srs_p=base/'SRS_2.2.0.yaml'; sad_p=base/'SAD_2.2.0.yaml'
errs=[]; warns=[]
try: s=yaml.safe_load(srs_p.read_text()); d=yaml.safe_load(sad_p.read_text())
except Exception as e:
 print('errors=1\nPARSE',e); sys.exit(1)
if s['metadata']['version']!='2.2.0' or d['metadata']['version']!='2.2.0': errs.append('version mismatch')
if s['metadata']['status']!='approved-implementation-baseline' or d['metadata']['status']!='approved-implementation-baseline': errs.append('status not approved')
# requirements
reqs=[]
for cat,items in s['requirements'].items():
 for r in items:
  reqs.append(r)
ids=[r['id'] for r in reqs]
if len(ids)!=len(set(ids)): errs.append('duplicate requirement ids')
acs=s['acceptance_criteria']; acids=[a['id'] for a in acs]
if len(acids)!=len(set(acids)): errs.append('duplicate AC ids')
reqset=set(ids); acset=set(acids)
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
# Cross-ref requirement IDs found in statements should exist.
blob=srs_p.read_text()+"\n"+sad_p.read_text()
for m in re.finditer(r'\b(?:CON|FR|HUE|TPL|UX-DEL|UX-VIS|DATA|PRIV|SEC|REL|QA)-\d{3}\b', blob):
 if m.group(0) not in reqset: errs.append(f'broken requirement ref {m.group(0)}')
# Guardrails
locked={x['id']:x['decision'] for x in s['decision_guardrails']['locked_decisions']}
for x in ['DG-001','DG-002','DG-003','DG-004','DG-005','DG-006']:
 if x not in locked: errs.append(f'missing guardrail {x}')
if 'explicit stakeholder requirement revision' not in s['decision_guardrails']['change_control']:
 errs.append('guardrail change control missing')
# Required simplification signals
must_srs=['remain permanently bound','same-bridge Hue resource-ID reuse','process-durable recovery journals for ordinary remote operations','literal private/local IPv4']
sl=srs_p.read_text()
for text in must_srs:
 if text.lower() not in sl.lower(): errs.append('missing simplification signal: '+text)
# Stale architecture mechanisms must not be selected. Negative mentions are allowed but positive key structures are forbidden.
# Use parsed-key/selected value checks rather than substring only.
if 'operational_recovery_state' not in s['persistent_state_contract'] or not str(s['persistent_state_contract']['operational_recovery_state']).lower().startswith('none required'):
 errs.append('operational recovery state not explicitly none')
if 'sqlite' in str(d.get('selected_platform',{})).lower(): errs.append('SQLite still selected platform')
if 'sqlite' in str(d.get('persistence_architecture',{})).lower(): errs.append('SQLite still selected persistence')
for c in d['runtime_components']:
 if c['name'] in {'LocalLanTransport','LocalLanNetworkSelector','LocalEndpointGuard'}: errs.append('stale LAN component '+c['name'])
# specific selected architecture checks
if d['persistence_architecture']['technology'].lower().find('asyncstorage')<0: errs.append('AsyncStorage not selected')
if len(d['runtime_components'])>12: warns.append(f'runtime component count high: {len(d["runtime_components"])}')
if 'no bridge switching/replacement workflow' not in str(d['architectural_decisions']).lower(): errs.append('no permanent bridge ADR')
if 'no same-bridge id-reuse mitigation' not in str(d['architectural_decisions']).lower(): errs.append('same-id risk not explicit in SAD')
if 'do not implement custom android network/vpn/proxy binding' not in str(d['architectural_decisions']).lower(): errs.append('network simplification not explicit')
if 'one hue mutation at a time' not in str(d['state_and_concurrency']).lower(): errs.append('simple Hue mutation serialization missing')
if 'no local durable journal' not in str(d['hue_v1_design']).lower(): errs.append('search simplification missing')
if 'no durable transaction state' not in str(d['architectural_decisions']).lower(): errs.append('provisioning simplification missing')
# 2.2 remediation contracts
if 'post /api' not in blob.lower(): errs.append('Hue provisioning API-root contract missing')
if 'safeareaprovider' not in str(d.get('selected_platform',{})).lower(): errs.append('safe-area mechanism missing')
if 'current diagnostic map' not in str(d.get('logging_and_diagnostics',{})).lower(): errs.append('current diagnostic ownership missing')
if 'react-native-really-awesome-button' not in str(d.get('architectural_decisions',{})).lower(): errs.append('legacy tile dependency decision missing')
for rid in ['REL-008','UX-VIS-001']:
 if rid not in reqset: errs.append('2.2 requirement missing: '+rid)
for aid in ['AC-REL-008','AC-UX-VIS-001']:
 if aid not in acset: errs.append('2.2 acceptance missing: '+aid)
# Backup privacy
if d['android_network_configuration']['backup'].lower().find('allowbackup=false')<0: errs.append('backup disable missing')
# full management not dropped
for rid in ['HUE-004','HUE-005','HUE-006','HUE-007','HUE-008','HUE-009','HUE-010']:
 r=next(x for x in reqs if x['id']==rid)
 if 'provide applicable' not in r['statement'].lower(): errs.append('full management weakened '+rid)
if 'documented v1' not in d['hue_v1_design']['full_management_strategy'].lower(): errs.append('full management catalog not explicit')
# Configuration-defaults 2.1 contract checks
srs_blob=srs_p.read_text().lower()
sad_blob=sad_p.read_text().lower()
for text in [
 'bundled default',
 'phone-local',
 'explicitly removed',
 'currently installed apk',
 'empty overlay',
]:
 if text not in srs_blob: errs.append('2.1 SRS contract missing: '+text)
for text in [
 'user overlay',
 'removedplugids',
 'stable ids',
 'precedence',
 'v1 migration',
 'empty v2 overlay',
]:
 if text not in sad_blob: errs.append('2.1 SAD architecture missing: '+text)
if d.get('configuration_defaults_overlay_architecture',{}).get('phone_independence','').lower().find('no phone-to-phone synchronization') < 0:
 errs.append('overlay phone-independence guardrail missing')
if d.get('configuration_defaults_overlay_architecture',{}).get('failure_rule','').lower().find('never authorize default resolution') < 0:
 errs.append('overlay fail-closed rule missing')
# Evidence hash if bundle present
expected=s['baseline_evidence']['sha256']; ep=base/s['baseline_evidence']['fixture_bundle']
if ep.exists():
 got=hashlib.sha256(ep.read_bytes()).hexdigest()
 if got!=expected: errs.append(f'evidence sha mismatch {got}')
else:
 pass
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
