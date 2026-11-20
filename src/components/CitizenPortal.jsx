import React, { useMemo, useState } from 'react';
import { normalizeStatus } from '../domain';

const choices=[
  {category:'Fire',icon:'♨',description:'Fire, smoke or explosion'},
  {category:'Flood',icon:'≈',description:'Flooding or water rescue'},
  {category:'Road Accident',icon:'⚑',description:'Collision or road hazard'},
  {category:'Infrastructure Damage',icon:'⚡',description:'Damage, collapse or utility risk'},
];

export default function CitizenPortal({incidents,onSubmit}) {
  const [category,setCategory]=useState('');
  const [trackingId,setTrackingId]=useState('');
  const [doneId,setDoneId]=useState('');
  const [geoMessage,setGeoMessage]=useState('');
  const [image,setImage]=useState(null);
  const [error,setError]=useState('');
  const tracked=useMemo(()=>incidents.find(item=>item.id.toLowerCase()===trackingId.trim().toLowerCase()),[incidents,trackingId]);
  const done=incidents.find(item=>item.id===doneId);

  async function readImage(file){
    if(!file){setImage(null);return}
    if(!file.type.startsWith('image/')){setError('Please choose an image file.');return}
    if(file.size>2_000_000){setError('Choose an image under 2 MB so the local report can be saved safely.');return}
    const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
    setImage({name:file.name,dataUrl});setError('');
  }
  function locate(){
    if(!navigator.geolocation){setGeoMessage('This browser does not provide location access. Enter the location manually.');return}
    setGeoMessage('Requesting your location…');
    navigator.geolocation.getCurrentPosition(position=>{const lat=document.querySelector('[name="citizen-latitude"]'),lng=document.querySelector('[name="citizen-longitude"]');if(lat&&lng){lat.value=position.coords.latitude.toFixed(6);lng.value=position.coords.longitude.toFixed(6)}setGeoMessage('Location added. Review the pin before submitting.')},()=>setGeoMessage('Location access was unavailable. You can still enter the location manually.'),{enableHighAccuracy:true,timeout:10000});
  }
  function submit(event){
    event.preventDefault();setError('');const form=new FormData(event.currentTarget);const lat=String(form.get('latitude')||'').trim(),lng=String(form.get('longitude')||'').trim();
    if(Boolean(lat)!==Boolean(lng)){setError('Enter both coordinates, or leave both blank.');return}
    const record=onSubmit({category:form.get('category'),title:`${form.get('category')} emergency`,description:form.get('description'),location:form.get('location'),latitude:lat?Number(lat):null,longitude:lng?Number(lng):null,affected:Number(form.get('affected')||0),urgency:form.get('urgency'),locationRisk:Number(form.get('locationRisk')),reporter:form.get('reporter')||'Citizen',image:image?.dataUrl||null,source:'citizen'});
    setDoneId(record.id);setCategory('');setImage(null);event.currentTarget.reset();
  }
  return <div className="citizen-page">
    <div className="citizen-hero"><div><span className="eyebrow">BEACON · COMMUNITY RESPONSE</span><h2>How can we help?</h2><p>Report an emergency so response teams can review and act. If anyone is in immediate danger, contact local emergency services.</p></div><button className="secondary-button" onClick={()=>{setCategory('');setDoneId('');document.getElementById('citizen-tracker')?.scrollIntoView({behavior:'smooth'})}}>Track a report</button></div>
    {done&&<section className="citizen-success panel"><span className="success-check">✓</span><div><strong>Report received</strong><p>Your reference is <b>{done.id}</b>. Keep it to check status. The report is now visible in the incident register for operator review.</p><span className="citizen-status">Current status · {normalizeStatus(done.status)}</span></div><button className="secondary-button" onClick={()=>{setTrackingId(done.id);setDoneId('');document.getElementById('citizen-tracker')?.scrollIntoView({behavior:'smooth'})}}>Track status</button></section>}
    <section className="citizen-choice-section"><div className="panel-head"><div><div className="eyebrow">REPORT AN EMERGENCY</div><h2>Choose what happened</h2></div><span>Pick a category to start</span></div><div className="emergency-options">{choices.map(item=><button type="button" key={item.category} className={`emergency-option ${category===item.category?'selected':''}`} onClick={()=>{setCategory(item.category);setError('');setTimeout(()=>document.getElementById('citizen-report-form')?.scrollIntoView({behavior:'smooth',block:'start'}),30)}}><span className={`emergency-option-icon ${item.category==='Fire'?'fire':item.category==='Flood'?'flood':item.category==='Road Accident'?'road':'infra'}`}>{item.icon}</span><b>{item.category}</b><small>{item.description}</small></button>)}</div></section>
    {category&&<form id="citizen-report-form" className="panel citizen-form" onSubmit={submit}><div className="panel-head"><div><div className="eyebrow">NEW COMMUNITY REPORT</div><h2>{category} emergency</h2></div><button type="button" className="text-action" onClick={()=>setCategory('')}>Change category</button></div><input type="hidden" name="category" value={category}/><div className="citizen-form-grid">
      <label className="wide">Location / nearest landmark<input name="location" placeholder="Street, neighbourhood, or landmark" required/><small>Enter the clearest location you can. Coordinates help responders locate the report.</small></label>
      <label>People affected<input name="affected" type="number" min="0" max="100000" defaultValue="1" required/></label>
      <label>Assessed severity<select name="severity" defaultValue="High"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label>
      <label>Urgency<select name="urgency" defaultValue="Immediate"><option>Immediate</option><option>Within 1 hour</option><option>Soon</option><option>Monitor</option></select></label>
      <label>Location risk<select name="locationRisk" defaultValue="2"><option value="1">Low · 1</option><option value="2">Moderate · 2</option><option value="3">Elevated · 3</option><option value="4">High · 4</option><option value="5">Severe · 5</option></select></label>
      <label>Contact name (optional)<input name="reporter" maxLength="80" placeholder="How can responders identify you?"/></label>
      <label className="wide">What is happening?<textarea name="description" rows="4" minLength="8" maxLength="1200" required placeholder="Describe the emergency, people at risk, access conditions, or other helpful details."/></label>
      <div className="wide citizen-location-fields"><div className="coordinate-heading"><b>Optional coordinates</b><button type="button" className="secondary-button geo-button" onClick={locate}>◎ Use my location</button></div><div className="coordinate-pair"><label>Latitude<input name="latitude" id="citizen-latitude" type="number" min="-90" max="90" step="any" placeholder="Optional"/></label><label>Longitude<input name="longitude" id="citizen-longitude" type="number" min="-180" max="180" step="any" placeholder="Optional"/></label></div>{geoMessage&&<small className="geo-message">{geoMessage}</small>}</div>
      <label className="wide">Add a photo (optional)<input type="file" accept="image/*" onChange={event=>readImage(event.target.files?.[0])}/><small>Image stays in this browser's local demo storage; max 2 MB.</small></label>{image&&<div className="image-preview wide"><img src={image.dataUrl} alt="Selected emergency report"/><span>{image.name}</span><button type="button" className="text-action" onClick={()=>setImage(null)}>Remove photo</button></div>}
      <p className="citizen-privacy-note wide">Priority is automatically suggested from reported severity, people affected, urgency and location risk. An operator reviews every report.</p>
    </div>{error&&<div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setCategory('')}>Cancel</button><button className="primary-button" type="submit">Submit emergency report</button></div></form>}
    <section id="citizen-tracker" className="panel citizen-tracker"><div className="panel-head"><div><div className="eyebrow">REPORT FOLLOW-UP</div><h2>Track an incident</h2></div></div><form className="tracker-form" onSubmit={event=>{event.preventDefault();setDoneId('')}}><label htmlFor="track-id">Enter your incident reference</label><div><input id="track-id" value={trackingId} onChange={event=>setTrackingId(event.target.value)} placeholder="e.g. INC-1234567"/><button className="primary-button">Check status</button></div></form>{trackingId&&<div className={`track-result ${tracked?'':'not-found'}`}>{tracked?<><div className="track-id"><b>{tracked.id}</b><span className={`severity ${(tracked.priorityOverride||tracked.suggestedPriority||tracked.severity).toLowerCase()}`}>{normalizeStatus(tracked.status)}</span></div><p>{tracked.title} · {tracked.location||'Location not provided'}</p><div className="track-steps">{['Reported','Assigned','Responding','Resolved'].map((step,index)=>{const current=['Reported','Assigned','Responding','Resolved'].indexOf(normalizeStatus(tracked.status));return <span key={step} className={index<=current?'done':''}>{step}</span>})}</div><small>Status is based on the latest operator update. Last update: {new Date(tracked.statusHistory?.at(-1)?.at||tracked.createdAt).toLocaleString()}</small></>:<p>No report found with that reference. Check the ID and try again.</p>}</div>}</section>
    <div className="citizen-demo-note">This portal is a local hackathon demo. It is not connected to emergency services; in immediate danger contact local emergency responders directly.</div>
  </div>;
}
