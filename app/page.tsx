'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, Battery, Bell, Bot, ChevronRight, CircleDot, Cpu, Gauge, HardHat, Layers3, MapPin, Radio, RefreshCcw, Settings, ShieldCheck, Signal, TrendingUp, Wifi, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MineMap = dynamic(() => import('@/components/mine-map'), { ssr: false })

type Severity = 'Normal' | 'Warning' | 'Critical'
type Sensor = { id: string; zone: string; lat: number; lng: number; displacement: number; tilt: number; vibration: number; battery: number; signal: number; status: 'Online' | 'Offline'; severity: Severity; lastSeen: string }

type HistoryPoint = { time: string; displacement: number; tilt: number; vibration: number }
type PredictionRisk = Severity

const baseSensors: Sensor[] = [
  { id: 'ORE-101', zone: 'North Ramp', lat: 51.505, lng: -0.09, displacement: 2.8, tilt: 0.18, vibration: 0.22, battery: 94, signal: 88, status: 'Online', severity: 'Normal', lastSeen: '12 sec ago' },
  { id: 'ORE-102', zone: 'North Ramp', lat: 51.508, lng: -0.078, displacement: 3.4, tilt: 0.24, vibration: 0.28, battery: 87, signal: 82, status: 'Online', severity: 'Normal', lastSeen: '16 sec ago' },
  { id: 'ORE-103', zone: 'East Gallery', lat: 51.51, lng: -0.062, displacement: 7.9, tilt: 0.62, vibration: 0.74, battery: 76, signal: 71, status: 'Online', severity: 'Warning', lastSeen: '8 sec ago' },
  { id: 'ORE-104', zone: 'East Gallery', lat: 51.502, lng: -0.052, displacement: 4.2, tilt: 0.31, vibration: 0.39, battery: 91, signal: 79, status: 'Online', severity: 'Normal', lastSeen: '21 sec ago' },
  { id: 'ORE-105', zone: 'Central Shaft', lat: 51.497, lng: -0.071, displacement: 2.1, tilt: 0.15, vibration: 0.18, battery: 83, signal: 91, status: 'Online', severity: 'Normal', lastSeen: '11 sec ago' },
  { id: 'ORE-106', zone: 'South Panel', lat: 51.491, lng: -0.081, displacement: 5.8, tilt: 0.46, vibration: 0.57, battery: 69, signal: 66, status: 'Online', severity: 'Warning', lastSeen: '34 sec ago' },
  { id: 'ORE-107', zone: 'South Panel', lat: 51.486, lng: -0.066, displacement: 3.1, tilt: 0.2, vibration: 0.25, battery: 96, signal: 84, status: 'Online', severity: 'Normal', lastSeen: '18 sec ago' },
  { id: 'ORE-108', zone: 'West Return', lat: 51.499, lng: -0.101, displacement: 2.4, tilt: 0.16, vibration: 0.2, battery: 58, signal: 43, status: 'Offline', severity: 'Warning', lastSeen: '7 min ago' },
]

const baseHistory: HistoryPoint[] = [
  { time: '10:00', displacement: 2.2, tilt: 0.18, vibration: 0.24 }, { time: '10:10', displacement: 2.5, tilt: 0.2, vibration: 0.27 }, { time: '10:20', displacement: 2.8, tilt: 0.22, vibration: 0.31 }, { time: '10:30', displacement: 3.1, tilt: 0.25, vibration: 0.35 }, { time: '10:40', displacement: 3.4, tilt: 0.29, vibration: 0.38 }, { time: '10:50', displacement: 3.8, tilt: 0.33, vibration: 0.44 }, { time: '11:00', displacement: 4.2, tilt: 0.37, vibration: 0.49 },
]

const navItems = [{ label: 'Dashboard', icon: Gauge }, { label: 'Live Monitoring', icon: Activity }, { label: 'Mine Map', icon: MapPin }, { label: 'AI Risk Analysis', icon: Bot }, { label: 'Alerts', icon: Bell }, { label: 'Sensor Health', icon: Cpu }, { label: 'Historical Data', icon: TrendingUp }, { label: 'Settings', icon: Settings }]

function severityClass(severity: Severity) { return severity === 'Critical' ? 'critical' : severity === 'Warning' ? 'warning' : 'normal' }
function average(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / values.length }

export default function Page() {
  const [sensors, setSensors] = useState(baseSensors)
  const [history, setHistory] = useState(baseHistory)
  const [selected, setSelected] = useState(baseSensors[2])
  const [simulating, setSimulating] = useState(false)
  const [predictionRisk, setPredictionRisk] = useState<PredictionRisk | null>(null)
  const [predictionConfidence, setPredictionConfidence] = useState<number | null>(null)
  const [predictionError, setPredictionError] = useState(false)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [range, setRange] = useState('1H')
  const [now, setNow] = useState(new Date('2026-09-06T11:02:00'))

  useEffect(() => {
    const clock = window.setInterval(() => setNow((value) => new Date(value.getTime() + 1000)), 1000)
    return () => window.clearInterval(clock)
  }, [])

  useEffect(() => {
    if (!simulating) return
    const timer = window.setInterval(() => {
      setSensors((current) => current.map((sensor, index) => {
        if (index !== 2 && index !== 5) return sensor
        const multiplier = index === 2 ? 1.14 : 1.08
        const displacement = Number((sensor.displacement * multiplier).toFixed(1))
        const tilt = Number((sensor.tilt * 1.12).toFixed(2))
        const vibration = Number((sensor.vibration * 1.13).toFixed(2))
        const severity: Severity = displacement > 12 ? 'Critical' : displacement > 8 ? 'Warning' : sensor.severity
        return { ...sensor, displacement, tilt, vibration, severity, lastSeen: 'now' }
      }))
      setHistory((current) => [...current.slice(-6), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), displacement: Number((current[current.length - 1].displacement * 1.08).toFixed(1)), tilt: Number((current[current.length - 1].tilt * 1.1).toFixed(2)), vibration: Number((current[current.length - 1].vibration * 1.1).toFixed(2)) }])
    }, 1800)
    return () => window.clearInterval(timer)
  }, [simulating])

  const calculatedRiskScore = Math.min(99, Math.round(average(sensors.map((sensor) => sensor.displacement)) * 7 + (simulating ? 20 : 0)))
  const calculatedRiskLevel: Severity = calculatedRiskScore > 72 ? 'Critical' : calculatedRiskScore > 45 ? 'Warning' : 'Normal'
  const riskLevel = predictionRisk ?? calculatedRiskLevel
  const riskScore = predictionRisk ? (predictionRisk === 'Critical' ? 88 : predictionRisk === 'Warning' ? 64 : 28) : calculatedRiskScore
  const confidence = predictionConfidence ?? 94.2

  const predictRisk = async () => {
    const sensor = sensors.find((item) => item.id === 'ORE-103') ?? sensors[2]
    setPredictionLoading(true)
    setPredictionError(false)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')
      console.log('[v0] Prediction API URL:', apiUrl ? `${apiUrl}/predict` : '(not configured)')
      if (!apiUrl) throw new Error('Prediction API URL is not configured')
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displacement_mm: sensor.displacement,
          displacement_rate_mm_per_15min: Number((sensor.displacement / 4).toFixed(3)),
          displacement_acceleration: Number((sensor.displacement * 0.08).toFixed(3)),
          displacement_rolling_mean: sensor.displacement,
          tilt_deg: sensor.tilt,
          tilt_rate_deg_per_15min: Number((sensor.tilt / 4).toFixed(3)),
          tilt_acceleration: Number((sensor.tilt * 0.08).toFixed(3)),
          tilt_rolling_mean: sensor.tilt,
          vibration_mm_s: sensor.vibration,
          vibration_rolling_mean: sensor.vibration,
          crack_change_mm: Number((sensor.displacement * 0.03).toFixed(3)),
          battery_pct: sensor.battery,
          signal_strength_pct: sensor.signal,
        }),
      })
      if (!response.ok) throw new Error(`Prediction request failed: ${response.status}`)
      const result: { risk_level?: string; confidence?: number } = await response.json()
      console.log('[v0] Prediction API response:', result)
      const returnedRisk = result.risk_level?.trim().toLowerCase()
      const normalizedRisk: PredictionRisk | null = returnedRisk === 'critical' ? 'Critical' : returnedRisk === 'warning' ? 'Warning' : returnedRisk === 'normal' ? 'Normal' : null
      if (!normalizedRisk || typeof result.confidence !== 'number') throw new Error('Invalid prediction response')
      setPredictionRisk(normalizedRisk)
      setPredictionConfidence(result.confidence)
    } catch {
      setPredictionError(true)
    } finally {
      setPredictionLoading(false)
    }
  }
  const online = sensors.filter((sensor) => sensor.status === 'Online').length
  const atRisk = sensors.filter((sensor) => sensor.severity !== 'Normal').length
  const zones = [...new Set(sensors.map((sensor) => sensor.zone))]

  const reset = () => { setSimulating(false); setSensors(baseSensors); setHistory(baseHistory); setSelected(baseSensors[2]); setPredictionRisk(null); setPredictionConfidence(null); setPredictionError(false); setPredictionLoading(false) }
  const updated = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const chartData = useMemo(() => range === '1H' ? history : [...history, ...history.map((point, index) => ({ ...point, time: `${index + 7}:00`, displacement: point.displacement * 0.9 }))], [history, range])

  return (
    <main className="ore-shell">
      <aside className="ore-sidebar">
        <div className="brand-block"><div className="brand-mark"><Layers3 /></div><div><div className="brand-name">ORE <span>AI</span></div><div className="brand-tag">OBSERVE • RECOGNIZE<br />EARLY WARNING</div></div></div>
        <div className="demo-pill"><span className="pulse-dot" /> DEMO MODE <span className="demo-copy">Simulated telemetry</span></div>
        <nav className="side-nav" aria-label="Primary navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}><Icon /><span>{label}</span>{label === 'Alerts' && <b>{simulating ? 3 : 2}</b>}</button>)}</nav>
        <div className="sidebar-footer"><div className="connection-row"><span className="status-dot online" /> Simulator connected</div><div className="api-note"><Wifi /> API-ready adapter<br /><span>ESP32 • LoRa • FastAPI</span></div></div>
      </aside>
      <section className="ore-content">
        <header className="topbar"><div><p className="eyebrow">MINE OPERATIONS CENTER / {activeNav.toUpperCase()}</p><h1>{activeNav === 'Dashboard' ? 'Underground Safety Overview' : activeNav}</h1></div><div className="top-actions"><div className="system-live"><span className="pulse-dot" /> SYSTEM LIVE <small>DEMO</small></div><div className="updated"><span>Last updated</span><strong>{updated}</strong></div><Button variant="outline" size="icon" aria-label="Notifications" className="icon-button"><Bell /></Button><div className="avatar">OM</div></div></header>
        <div className="demo-banner"><div><span className="banner-icon"><Radio /></span><div><strong>DEMO MODE — Simulated sensor network</strong><p>Readings are realistic prototype data. Hardware ingestion is ready for future ESP32 + LoRa + FastAPI connection.</p></div></div><span className="banner-code">SIM/ORE-2026</span></div>
        <div className="kpi-grid">
          <Kpi icon={<Cpu />} label="Active Sensor Nodes" value="08" detail="of 08 provisioned" tone="blue" />
          <Kpi icon={<Wifi />} label="Nodes Online" value={`${online.toString().padStart(2, '0')}`} detail={`${Math.round(online / sensors.length * 100)}% connectivity`} tone="green" />
          <Kpi icon={<AlertTriangle />} label="Zones at Risk" value={`${zones.filter((zone) => sensors.filter((s) => s.zone === zone && s.severity !== 'Normal').length > 0).length.toString().padStart(2, '0')}`} detail="requires attention" tone="yellow" />
          <Kpi icon={<Bell />} label="Active Alerts" value={simulating ? '03' : '02'} detail="1 new simulated" tone="red" />
          <Kpi icon={<ShieldCheck />} label="Overall Mine Risk" value={`${riskScore}%`} detail={`${riskLevel} assessment`} tone={riskLevel === 'Critical' ? 'red' : riskLevel === 'Warning' ? 'yellow' : 'green'} />
        </div>
        <div className="dashboard-grid">
          <section className="panel map-panel"><PanelHeading title="Live Mine Map" subtitle="Sensor node topology · simulated coordinates" icon={<MapPin />} action={<span className="map-legend"><i className="legend normal" /> Normal <i className="legend warning" /> Warning <i className="legend critical" /> Critical</span>} /><div className="map-wrap"><MineMap sensors={sensors} selected={selected} onSelect={setSelected} /><div className="map-overlay"><span>LEVEL 4 / EAST SEAM</span><strong>2,840 m below surface</strong></div></div><div className="selected-sensor"><div><span className={`sensor-status ${severityClass(selected.severity)}`} /><strong>{selected.id}</strong><span>{selected.zone}</span></div><div className="selected-values"><span><b>{selected.displacement} mm</b> displacement</span><span><b>{selected.tilt}°</b> tilt</span><span><b>{selected.vibration} g</b> vibration</span></div><span className={`severity-badge ${severityClass(selected.severity)}`}>{selected.severity}</span></div></section>
          <section className="panel monitoring-panel"><PanelHeading title="Live Sensor Monitoring" subtitle="Aggregated telemetry · DEMO MODE" icon={<Activity />} action={<div className="range-tabs">{['1H', '6H', '24H', '7D'].map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div>} /><div className="chart-legend"><span><i className="line displacement" /> Displacement (mm)</span><span><i className="line tilt" /> Tilt (°)</span><span><i className="line vibration" /> Vibration (g)</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="displacementFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36b9e8" stopOpacity={0.25} /><stop offset="100%" stopColor="#36b9e8" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(147,168,183,.12)" vertical={false} /><XAxis dataKey="time" tick={{ fill: '#78909c', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#78909c', fontSize: 10 }} axisLine={false} tickLine={false} width={28} /><Tooltip contentStyle={{ background: '#12222c', border: '1px solid #29434e', borderRadius: 6, color: '#e9f3f5' }} /><Area type="monotone" dataKey="displacement" stroke="#36b9e8" fill="url(#displacementFill)" strokeWidth={2} /><Area type="monotone" dataKey="tilt" stroke="#ffbd54" fill="none" strokeWidth={2} /><Area type="monotone" dataKey="vibration" stroke="#f36e67" fill="none" strokeWidth={2} /></AreaChart></ResponsiveContainer></div><div className="chart-foot"><span><TrendingUp /> Baseline trend: <b className="text-yellow">+18.4%</b> over selected period</span><span>Sampling interval: 10 min</span></div></section>
          <section className="panel assessment-panel"><PanelHeading title="AI Risk Assessment" subtitle="Anomaly detection & deformation trend analysis" icon={<Bot />} action={<span className="ai-badge"><span className="pulse-dot" /> AI ENGINE</span>} /><div className="risk-content"><div className="risk-gauge"><div className={`gauge-ring ${severityClass(riskLevel)}`}><strong>{riskScore}</strong><span>/ 100</span></div><span className={`severity-badge ${severityClass(riskLevel)}`}>{riskLevel} risk</span></div><div className="risk-detail"><div className="confidence"><span>Model confidence</span><strong>{confidence.toFixed(2)}%</strong><div className="progress"><i style={{ width: `${confidence}%` }} /></div></div><p className="ai-explanation">Pattern analysis indicates a <b>{riskLevel.toLowerCase()} deformation signal</b> concentrated around East Gallery. This is a risk assessment for early warning, not a guaranteed collapse prediction.</p>{predictionError && <p className="ai-explanation" role="status">Live AI prediction is unavailable. Showing the demo assessment instead.</p>}<div className="factor-list"><span><i className="factor blue" /> Displacement trend <b>+24%</b></span><span><i className="factor yellow" /> Tilt acceleration <b>+11%</b></span><span><i className="factor red" /> Vibration anomaly <b>+08%</b></span></div></div></div></section>
          <section className="panel alerts-panel"><PanelHeading title="Early Warning & Alerts" subtitle="Prioritized events · simulated" icon={<Bell />} action={<button className="text-action">View all <ChevronRight /></button>} /><div className="alert-list"><AlertRow tone={riskLevel === 'Critical' ? 'red' : 'yellow'} icon={<AlertTriangle />} title={predictionError ? 'AI prediction unavailable' : predictionRisk ? `${predictionRisk} risk detected by AI` : simulating ? 'Abnormal displacement detected' : 'Increasing tilt trend'} zone="East Gallery · ORE-103" time={predictionError ? 'now' : predictionRisk ? 'just now' : simulating ? 'now' : '4 min ago'} /><AlertRow tone="yellow" icon={<TrendingUp />} title="High vibration activity" zone="South Panel · ORE-106" time="12 min ago" /><AlertRow tone="gray" icon={<Wifi />} title="Sensor communication failure" zone="West Return · ORE-108" time="7 min ago" /></div></section>
        </div>
        <div className="lower-grid"><section className="panel health-panel"><PanelHeading title="Sensor Health" subtitle="Telemetry status across the network" icon={<Signal />} action={<button className="text-action">Manage nodes <ChevronRight /></button>} /><div className="health-grid">{sensors.slice(0, 6).map((sensor) => <div className="health-item" key={sensor.id}><div className="health-top"><span className={`sensor-status ${sensor.status === 'Offline' ? 'critical' : 'normal'}`} /><strong>{sensor.id}</strong><span className={sensor.status === 'Offline' ? 'offline' : 'online-text'}>{sensor.status}</span></div><div className="health-metrics"><span><Battery /> {sensor.battery}%</span><span><Signal /> {sensor.signal}%</span><small>{sensor.lastSeen}</small></div><div className="mini-progress"><i className={sensor.battery < 70 ? 'low' : ''} style={{ width: `${sensor.battery}%` }} /></div></div>)}</div></section><section className="panel controls-panel"><PanelHeading title="Simulation Controls" subtitle="Test the early-warning response" icon={<Radio />} /><div className="simulation-copy"><div><strong>Ground movement scenario</strong><p>Progressively increases correlated readings at high-risk nodes.</p></div><div className="control-buttons"><Button className="simulate-button" onClick={() => { setSimulating(true); void predictRisk() }} disabled={simulating || predictionLoading}><Activity data-icon="inline-start" /> {predictionLoading ? 'Requesting AI assessment' : simulating ? 'Scenario running' : 'Simulate Ground Movement'}</Button><Button variant="outline" onClick={reset}><RefreshCcw data-icon="inline-start" /> Reset</Button></div></div></section></div>
        <section className="panel zones-panel"><PanelHeading title="Zone Risk Overview" subtitle="Aggregated by mine area · simulated telemetry" icon={<HardHat />} action={<span className="table-meta">{zones.length} monitored zones</span>} /><div className="table-scroll"><table><thead><tr><th>Mine zone</th><th>Risk level</th><th>Displacement trend</th><th>Tilt trend</th><th>Vibration</th><th>Sensor status</th></tr></thead><tbody>{zones.map((zone) => { const zoneSensors = sensors.filter((sensor) => sensor.zone === zone); const zoneSensor = zoneSensors[0]; const zoneSeverity = zoneSensors.some((s) => s.severity === 'Critical') ? 'Critical' : zoneSensors.some((s) => s.severity === 'Warning') ? 'Warning' : 'Normal'; return <tr key={zone}><td><strong>{zone}</strong><small>{zoneSensors.length} sensor nodes</small></td><td><span className={`severity-badge ${severityClass(zoneSeverity)}`}><span className="status-dot" /> {zoneSeverity}</span></td><td><span className="trend-up">↑ {zoneSensor.displacement} mm</span><small>+{Math.round(zoneSensor.displacement * 4.2)}% / 1h</small></td><td><span>{zoneSensor.tilt}°</span><small>stable trend</small></td><td><span>{zoneSensor.vibration} g</span><small className={zoneSensor.vibration > .5 ? 'text-red' : ''}>{zoneSensor.vibration > .5 ? 'elevated' : 'within range'}</small></td><td><span className="online-text"><span className="status-dot online" /> {zoneSensors.filter((s) => s.status === 'Online').length}/{zoneSensors.length} online</span></td></tr> })}</tbody></table></div></section>
        <footer className="footer-note"><span><ShieldCheck /> ORE AI early-warning prototype · Prepared for SIH 2026</span><span>Data source: <b>Simulated telemetry</b> · Adapter ready for FastAPI</span></footer>
      </section>
    </main>
  )
}

function Kpi({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) { return <div className="kpi-card"><div className={`kpi-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div> }
function PanelHeading({ title, subtitle, icon, action }: { title: string; subtitle: string; icon: React.ReactNode; action?: React.ReactNode }) { return <div className="panel-heading"><div className="heading-icon">{icon}</div><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <div className="heading-action">{action}</div>}</div> }
function AlertRow({ tone, icon, title, zone, time }: { tone: string; icon: React.ReactNode; title: string; zone: string; time: string }) { return <div className="alert-row"><div className={`alert-icon ${tone}`}>{icon}</div><div><strong>{title}</strong><span>{zone}</span></div><time>{time}</time></div> }
