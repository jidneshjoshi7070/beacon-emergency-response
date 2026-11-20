import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { CATEGORIES, MUMBAI_CENTER, PRIORITY_COLOR, hasCoordinates } from '../domain';

const incidentPriority = item => item.priorityOverride || item.suggestedPriority || item.severity || 'Medium';
const coordinate = item => [Number(item.latitude), Number(item.longitude)];
const unitIcon = type => {const glyph=type==='Ambulance'?'✚':type.includes('Fire')?'♨':type==='Police Unit'?'⬟':'⌖';return L.divIcon({ className:'unit-marker-shell', html:`<span class="unit-marker ${type==='Ambulance'?'ambulance':type.includes('Fire')?'fire-unit':type==='Police Unit'?'police-unit':'rescue-unit'}" title="${type}">${glyph}</span>`, iconSize:[30,30], iconAnchor:[15,15], popupAnchor:[0,-14] })};

function MapCamera({ target, fitPoints, fitToken }) {
  const map = useMap();
  useEffect(()=>{if(target)map.flyTo(target,15,{duration:.55})},[map,target]);
  useEffect(()=>{if(fitToken&&fitPoints.length)map.fitBounds(fitPoints,{padding:[36,36],maxZoom:14})},[map,fitPoints,fitToken]);
  return null;
}

export function LeafletMapView({ incidents, resources, selectedIncidentId, onSelectIncident, height='405px', compact=false }) {
  const [category,setCategory]=useState('All categories');
  const [severity,setSeverity]=useState('All priorities');
  const [fitToken,setFitToken]=useState(0);
  const [tileError,setTileError]=useState(false);
  const locatedIncidents=useMemo(()=>incidents.filter(hasCoordinates),[incidents]);
  const locatedResources=useMemo(()=>resources.filter(hasCoordinates),[resources]);
  const shown=useMemo(()=>locatedIncidents.filter(item=>(category==='All categories'||item.category===category)&&(severity==='All priorities'||incidentPriority(item)===severity)),[locatedIncidents,category,severity]);
  const selected=shown.find(item=>item.id===selectedIncidentId)||locatedIncidents.find(item=>item.id===selectedIncidentId);
  const target=useMemo(()=>selected?coordinate(selected):null,[selected]);
  const fitPoints=useMemo(()=>[...shown,...locatedResources].map(coordinate),[shown,locatedResources]);
  const fitAll=()=>setFitToken(value=>value+1);

  return <section className={`google-map-panel leaflet-panel ${compact?'compact':''}`}>
    <div className="google-map-panel-head"><div><div className="eyebrow">FIELD OPERATIONS · OPENSTREETMAP</div><h2>Live incident map</h2><p>Mumbai, India · map opens without an API key</p></div><span className="map-connection connected"><i/>MAP READY</span></div>
    <div className="map-toolbar"><div className="map-filter-group"><label><span>Category</span><select value={category} onChange={event=>setCategory(event.target.value)}><option>All categories</option>{CATEGORIES.map(value=><option key={value}>{value}</option>)}</select></label><label><span>Priority</span><select value={severity} onChange={event=>setSeverity(event.target.value)}><option>All priorities</option>{['Critical','High','Medium','Low'].map(value=><option key={value}>{value}</option>)}</select></label></div><div className="map-tools"><button className="fit-button" onClick={fitAll}>Fit all markers</button></div></div>
    <div className="leaflet-map-wrap" style={{height}}>
      <MapContainer center={MUMBAI_CENTER} zoom={11} scrollWheelZoom zoomControl={false} className="leaflet-map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'} maxZoom={19} eventHandlers={{tileerror:()=>setTileError(true),tileload:()=>setTileError(false)}} />
        <ZoomControl position="topright"/><MapCamera target={target} fitPoints={fitPoints} fitToken={fitToken}/>
        {shown.map(item=><CircleMarker key={item.id} center={coordinate(item)} radius={item.id===selectedIncidentId?10:8} pathOptions={{color:'#f8fafc',weight:2,fillColor:PRIORITY_COLOR[incidentPriority(item)]||'#eab308',fillOpacity:.96}} eventHandlers={{click:()=>onSelectIncident?.(item.id)}}>
          <Popup><div className="leaflet-popup-card"><span className={`severity ${incidentPriority(item).toLowerCase()}`}>{item.priorityOverride?'Override · ':''}{incidentPriority(item)}{item.priorityOverride?'':' priority'}</span><b>{item.title}</b><small>{item.id} · {item.category}</small><small>Score {item.score}/100 · {item.status}</small>{item.simulated&&<em>SIMULATED REPORT</em>}</div></Popup>
        </CircleMarker>)}
        {locatedResources.map(resource=><Marker key={resource.id} position={coordinate(resource)} icon={unitIcon(resource.type)}>
          <Popup><div className="leaflet-popup-card"><b>{resource.type} · {resource.id}</b><small>{resource.availability}{resource.assignedIncident?` · ${resource.assignedIncident}`:''}</small><small>{resource.location}</small>{resource.simulated&&<em>SIMULATED LOCATION</em>}</div></Popup>
        </Marker>)}
      </MapContainer>
      {tileError&&<div className="tile-warning">Map tiles did not load. Check your connection; report and dispatch tools remain available.</div>}
    </div>
    <div className="map-legend"><span><i className="critical"/>Critical</span><span><i className="high"/>High</span><span><i className="medium"/>Medium</span><span><i className="low"/>Low</span><span><i className="resource-key"/>Response teams</span></div>
    <div className="map-footer-note">{shown.length} incidents and {locatedResources.length} resource teams plotted from recorded coordinates. Demo coordinates are simulated.</div>
  </section>;
}

export function LeafletLocationPicker({ value, onChange, locationLabel='' }) {
  const point=hasCoordinates(value)?coordinate(value):MUMBAI_CENTER;
  return <div className="location-picker"><div className="picker-top"><div><b>Pin the incident location</b><span>{hasCoordinates(value)?`${point[0].toFixed(5)}, ${point[1].toFixed(5)}${locationLabel?` · ${locationLabel}`:''}`:'Tap the map to add precise coordinates'}</span></div>{hasCoordinates(value)&&<button type="button" onClick={()=>onChange({latitude:null,longitude:null})}>Clear pin</button>}</div>
    <div className="location-picker-map"><MapContainer center={point} zoom={hasCoordinates(value)?14:10} scrollWheelZoom={false} zoomControl={false} className="leaflet-map"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19}/><ZoomControl position="topright"/><ClickToPick onPick={onChange}/>{hasCoordinates(value)&&<CircleMarker center={point} radius={8} pathOptions={{color:'#fff',weight:2,fillColor:'#2563eb',fillOpacity:1}}/>}</MapContainer></div>
  </div>;
}
function ClickToPick({onPick}) {const map=useMap();const [position,setPosition]=useState(null);useEffect(()=>{if(position)map.panTo(position)},[map,position]);return <MapClickHandler onClick={point=>{setPosition(point);onPick({latitude:point[0],longitude:point[1]})}}/>}
function MapClickHandler({onClick}) {useMapEvents({click:event=>onClick([event.latlng.lat,event.latlng.lng])});return null}
