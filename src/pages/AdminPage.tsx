import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Bell, Building2, CalendarDays, ChevronDown, CircleHelp, Clock3, FileText, LayoutDashboard, LogOut, MapPin, Menu, MonitorSmartphone, PlugZap, Plus, Search, Settings, Users, Webhook } from 'lucide-react';
import { getDashboard } from '../api';
import { BrandMark } from '../components/BrandMark';
import type { DashboardData, VisitType } from '../types';

const nav = [
  { icon: LayoutDashboard, label: 'Overview' }, { icon: Users, label: 'Live lobby', badge: '4' },
  { icon: Building2, label: 'Locations' }, { icon: MonitorSmartphone, label: 'Kiosks' },
  { icon: FileText, label: 'Forms & templates' }, { icon: PlugZap, label: 'Integrations' },
  { icon: Webhook, label: 'Webhooks' },
];

export function AdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => { getDashboard().then(setData); }, []);
  if (!data) return <div className="loading-screen"><Activity className="pulse" /><span>Loading workspace…</span></div>;

  return (
    <main className="admin-shell">
      <aside className={`admin-sidebar ${menu ? 'admin-sidebar--open' : ''}`}>
        <div className="sidebar-brand"><BrandMark inverse /><button onClick={() => setMenu(false)}>×</button></div>
        <div className="org-switch"><span>HC</span><p><strong>{data.organizationName}</strong><small>Business plan</small></p><ChevronDown size={16} /></div>
        <nav>{nav.map(({ icon: Icon, label, badge }, i) => <button key={label} className={i === 0 ? 'active' : ''}><Icon size={18} /><span>{label}</span>{badge && <b>{badge}</b>}</button>)}</nav>
        <div className="sidebar-bottom"><button><CircleHelp size={18} /> Help center</button><button><Settings size={18} /> Settings</button><div className="admin-profile"><span>AM</span><p><strong>Avery Morgan</strong><small>Administrator</small></p><LogOut size={17} /></div></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar"><button className="menu-button" onClick={() => setMenu(true)}><Menu /></button><div className="search"><Search size={17} /><input placeholder="Search visitors, locations, or kiosks" /><kbd>⌘ K</kbd></div><div className="topbar-actions"><button><Bell size={19} /><i /></button><button className="add-button"><Plus size={17} /> Add kiosk</button></div></header>
        <div className="admin-content">
          <div className="page-heading"><div><span className="eyebrow">Sunday, November 15</span><h1>Good morning, Avery.</h1><p>Here’s what’s happening across your offices today.</p></div><button className="date-button"><CalendarDays size={17} /> Today <ChevronDown size={15} /></button></div>
          <div className="stat-grid">{data.stats.map((stat, i) => <article className="stat-card" key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><small className={i === 2 ? 'neutral' : ''}>{stat.delta}</small></article>)}</div>
          <div className="dashboard-grid">
            <article className="panel activity-panel"><div className="panel-heading"><div><h2>Check-in activity</h2><p>Visitors by hour · all locations</p></div><button>This week <ChevronDown size={14} /></button></div><ActivityChart values={data.hourly} /></article>
            <article className="panel lobby-panel"><div className="panel-heading"><div><h2>Live lobby</h2><p>4 visitors waiting now</p></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div><div className="lobby-list">{data.visits.slice(0, 4).map(visit => <div key={visit.id} className="lobby-row"><div className="avatar">{visit.name.split(' ').map(n => n[0]).join('')}</div><div><strong>{visit.name}</strong><small>{labelType(visit.type)} · {visit.host}</small></div><span className={visit.waitMinutes > 10 ? 'wait wait--long' : 'wait'}>{visit.waitMinutes} min</span></div>)}</div></article>
          </div>
          <article className="panel locations-panel"><div className="panel-heading"><div><h2>Location performance</h2><p>Today’s lobby activity at a glance</p></div><button className="text-button">Manage locations <ArrowUpRight size={14} /></button></div><div className="table-wrap"><table><thead><tr><th>Location</th><th>Status</th><th>Waiting now</th><th>Avg. wait</th><th>Today</th><th /></tr></thead><tbody>{data.locations.map((location, i) => <tr key={location.id}><td><div className="location-cell"><span><MapPin size={17} /></span><p><strong>{location.name}</strong><small>{location.city}</small></p></div></td><td><span className="online"><i /> {location.status}</span></td><td>{location.waiting}</td><td>{location.avgWait} min</td><td>{[28, 17, 12][i] ?? 8} check-ins</td><td><button>•••</button></td></tr>)}</tbody></table></div></article>
          <div className="admin-note"><Clock3 size={17} /><span><strong>All systems operational.</strong> Last sync across 3 locations was less than a minute ago.</span></div>
        </div>
      </section>
    </main>
  );
}

function ActivityChart({ values }: { values: number[] }) {
  const max = Math.max(...values); const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${80 - (v / max) * 66}`).join(' ');
  return <div className="chart"><div className="chart-y"><span>30</span><span>20</span><span>10</span><span>0</span></div><svg viewBox="0 0 100 88" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d3a34f" stopOpacity=".32"/><stop offset="1" stopColor="#d3a34f" stopOpacity="0"/></linearGradient></defs><path d={`M ${points} L 100,84 L 0,84 Z`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#c78f30" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/></svg><div className="chart-x"><span>8 AM</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span></div></div>;
}

function labelType(type: VisitType) { return type === 'appointment' ? 'Appointment' : type === 'walk_in' ? 'New inquiry' : 'Vendor'; }
