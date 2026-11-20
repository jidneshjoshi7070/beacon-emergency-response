export const STORAGE_KEY = 'beacon-emergency-demo-v1';
export const MUMBAI_CENTER = [19.076, 72.8777];
export const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];
export const STATUSES = ['Reported', 'Assigned', 'Responding', 'Resolved'];
export const STATUS_MAP = { Reported: 'Reported', Verified: 'Reported', Dispatched: 'Assigned', Assigned: 'Assigned', 'Team En Route': 'Responding', 'On Scene': 'Responding', Responding: 'Responding', Resolved: 'Resolved' };
export const CATEGORIES = ['Fire', 'Flood', 'Road Accident', 'Infrastructure Damage', 'Medical', 'Other'];
export const PRIORITY_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
const demoPoints = [[19.076,72.8777],[19.0176,72.8562],[19.1136,72.8697],[19.0544,72.8402],[19.033,72.857],[19.0896,72.8656],[19.0632,72.902],[19.128,72.825]];
const demoRecords = [
  ['Smoke reported at a mixed-use building','Fire','Critical','Harbour Market',8,'Resolved'],
  ['Two-vehicle collision near a junction','Road Accident','High','Civic Circle',3,'Responding'],
  ['Water rising in a low-lying lane','Flood','High','Canal Side',25,'Assigned'],
  ['Electric pole leaning over footpath','Infrastructure Damage','Medium','Garden Road',0,'Reported'],
  ['Medical assistance requested at a park','Medical','High','Lakeview Park',2,'Reported'],
  ['Road surface damaged after rain','Road Accident','Medium','Mill Road',4,'Reported'],
  ['Request to check on residents after a landslip','Flood','High','Hillview Lane',6,'Assigned'],
  ['Damaged public sign needs replacement','Infrastructure Damage','Low','Station Approach',0,'Resolved'],
];
const resourceCatalog = [
  ['AM-01','Ambulance','Fort'],['AM-02','Ambulance','Dadar'],['FE-01','Fire Brigade','Andheri'],['FE-02','Fire Brigade','Bandra'],
  ['PL-01','Police Unit','CST'],['PL-02','Police Unit','Kurla'],['RS-01','Rescue Team','Worli'],['RS-02','Rescue Team','Bandra'],
];

export function normalizeStatus(status) { return STATUS_MAP[status] || 'Reported'; }
export function calculatePriority({ severity='Low', affected=0, urgency='Soon', locationRisk=2 }) {
  const severityPoints = { Critical: 40, High: 30, Medium: 20, Low: 10 }[severity] || 10;
  const peoplePoints = Math.min(25, Math.round(Math.log2(Math.max(0, Number(affected)||0) + 1) * 5));
  const urgencyPoints = { Immediate: 20, 'Within 1 hour': 15, Soon: 8, Monitor: 2 }[urgency] ?? 8;
  const riskPoints = Math.max(0, Math.min(5, Number(locationRisk)||0)) * 3;
  const score = Math.min(100, severityPoints + peoplePoints + urgencyPoints + riskPoints);
  const suggestedPriority = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 32 ? 'Medium' : 'Low';
  const reasons = [`${severity} severity (+${severityPoints})`, `${Number(affected)||0} people affected (+${peoplePoints})`, `${urgency.toLowerCase()} urgency (+${urgencyPoints})`, `location risk ${locationRisk}/5 (+${riskPoints})`];
  return { score, suggestedPriority, breakdown: { severity: severityPoints, people: peoplePoints, urgency: urgencyPoints, locationRisk: riskPoints }, reason: reasons.join(' · ') };
}

export function distanceKm(a, b) {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return Infinity;
  const radians = value => value * Math.PI / 180;
  const dLat = radians(Number(b.latitude) - Number(a.latitude));
  const dLng = radians(Number(b.longitude) - Number(a.longitude));
  const lat1 = radians(Number(a.latitude)), lat2 = radians(Number(b.latitude));
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
export function hasCoordinates(record) {
  return Number.isFinite(Number(record?.latitude)) && Number.isFinite(Number(record?.longitude)) && record?.latitude !== '' && record?.latitude != null && record?.longitude !== '' && record?.longitude != null && Math.abs(Number(record.latitude)) <= 90 && Math.abs(Number(record.longitude)) <= 180;
}
export function suitableTypes(category) {
  if (category === 'Fire') return ['Fire Brigade','Fire Engine'];
  if (category === 'Medical') return ['Ambulance'];
  if (category === 'Road Accident') return ['Ambulance','Rescue Team','Police Unit'];
  if (category === 'Flood' || category === 'Infrastructure Damage') return ['Rescue Team','Fire Brigade','Fire Engine'];
  return ['Rescue Team','Ambulance','Police Unit','Fire Brigade','Fire Engine'];
}
export function findDuplicateReports(candidate, incidents) {
  const now = Date.parse(candidate.createdAt || new Date().toISOString());
  const tokenSet = value => new Set(String(value||'').toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 3));
  const words = tokenSet(candidate.title);
  return incidents.filter(item => {
    if (normalizeStatus(item.status)==='Resolved' || item.duplicateReview==='not-duplicate') return false;
    if (item.category !== candidate.category || Math.abs(now-Date.parse(item.createdAt||now)) > 12*60*60*1000) return false;
    const nearby = distanceKm(candidate,item) <= 0.6;
    const priorWords = tokenSet(item.title);
    const overlap = [...words].filter(word=>priorWords.has(word)).length;
    const similar = words.size > 0 && overlap / Math.max(1,Math.min(words.size,priorWords.size)) >= .5;
    const samePlace = candidate.location && item.location && candidate.location.trim().toLowerCase() === item.location.trim().toLowerCase();
    return nearby || similar || samePlace;
  }).map(item=>item.id);
}

export function createDemoData() {
  const now = Date.now();
  const incidents = demoRecords.map(([title,category,severity,place,affected,status],i)=>{
    const createdAt = new Date(now-(i*19+8)*60000).toISOString();
    const priority = calculatePriority({severity,affected,urgency:i<2?'Immediate':'Soon',locationRisk:i===2?5:2});
    return { id:`INC-DEMO-0${i+1}`, title, category, severity, ...priority, priorityOverride:null, status, location:`${place}, Mumbai`, latitude:demoPoints[i][0], longitude:demoPoints[i][1], simulated:true, affected, urgency:i<2?'Immediate':'Soon', locationRisk:i===2?5:2, reporter:'Beacon demo', description:'Simulated demonstration report for the Beacon command centre.', createdAt, statusHistory:[{status,at:createdAt,note:'Simulated demo record'}], assignedResource:null, duplicateOf:[], duplicateReview:null, source:'demo' };
  });
  const resources = resourceCatalog.map(([id,type,location],i)=>({id,type,location:`${location}, Mumbai`,latitude:demoPoints[i][0]+.008,longitude:demoPoints[i][1]+.008,simulated:true,availability:i===0?'Assigned':'Available',assignedIncident:i===0?'INC-DEMO-03':null}));
  const assigned = incidents.find(x=>x.id==='INC-DEMO-03');
  assigned.assignedResource='AM-01';
  return { incidents, resources };
}

export function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved?.incidents) && Array.isArray(saved?.resources)) {
      const demo = createDemoData();
      const incidents = saved.incidents.map(item=>{
        const match=/^INC-DEMO-0([1-8])$/.exec(item.id||'');
        const index=match?Number(match[1])-1:-1;
        const seeded=demo.incidents[index];
        const legacyStatus=item.status;
        const history=item.statusHistory||[{status:legacyStatus||'Reported',at:item.createdAt||new Date().toISOString(),note:'Existing saved record'}];
        const priority=calculatePriority({severity:item.severity||'Low',affected:item.affected||0,urgency:item.urgency||'Soon',locationRisk:item.locationRisk??2});
        return {...item,...(seeded&&item.latitude==null&&item.longitude==null?{latitude:seeded.latitude,longitude:seeded.longitude,simulated:true}:{}),...(item.category==='Infrastructure'?{originalCategory:item.category,category:'Infrastructure Damage'}:{}),legacyScore:Number.isFinite(item.score)&&item.score!==priority.score?(item.legacyScore??item.score):item.legacyScore,score:priority.score,severity:item.severity||priority.suggestedPriority,suggestedPriority:priority.suggestedPriority,priorityBreakdown:priority.breakdown,priorityReason:item.priorityOverride?item.priorityReason||priority.reason:priority.reason,urgency:item.urgency||'Soon',locationRisk:item.locationRisk??2,status:normalizeStatus(legacyStatus),statusHistory:history};
      });
      const resources=saved.resources.map(item=>{
        const seeded=demo.resources.find(resource=>resource.id===item.id);
        const type=item.type==='Fire Engine'?'Fire Brigade':item.type;
        const linkedIncident=saved.incidents.find(incident=>incident.assignedResource===item.id)?.id;
        return {...item,type,...(seeded&&item.latitude==null&&item.longitude==null?{latitude:seeded.latitude,longitude:seeded.longitude,simulated:true}:{}),availability:item.availability||'Available',assignedIncident:item.assignedIncident||linkedIncident||null};
      });
      // Reconcile both sides of the assignment link. Older saves may only have
      // recorded the incident's team (or the team's incident), and resolved
      // incidents must not keep a team occupied after reload.
      const resourceIds=new Set(resources.map(resource=>resource.id));
      const claimedResources=new Set();
      const normalizedIncidents=incidents.map(incident=>{
        const isResolved=normalizeStatus(incident.status)==='Resolved';
        const resourceId=incident.assignedResource;
        if(isResolved||!resourceIds.has(resourceId)||claimedResources.has(resourceId)){
          return {...incident,...(resourceId?{assignedResource:null}:{}),...(resourceId&&normalizeStatus(incident.status)==='Assigned'?{status:'Reported'}:{})};
        }
        claimedResources.add(resourceId);
        return incident;
      });
      const normalizedResources=resources.map(resource=>{
        const linked=normalizedIncidents.find(incident=>incident.assignedResource===resource.id&&normalizeStatus(incident.status)!=='Resolved');
        return linked?{...resource,availability:'Assigned',assignedIncident:linked.id}:{...resource,availability:'Available',assignedIncident:null};
      });
      return {...saved,incidents:normalizedIncidents,resources:normalizedResources};
    }
  } catch { /* Fall back to the bundled demo if storage is corrupt. */ }
  return createDemoData();
}
