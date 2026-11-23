'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';

const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const auth = createAuthClient({ baseURL: base, plugins: [jwtClient()] });
const categories = ['Haircut & Styling','Hair Coloring','Hair Treatment','Facial & Skincare','Makeup','Manicure & Pedicure','Spa & Massage'];
const slots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];
const empty = { serviceName:'',category:categories[0],description:'',price:'',duration:'',image:'',status:'active' };
const money = value => '$' + Number(value).toFixed(2);
async function api(path, options = {}) {
  const { private: protectedRoute, body, ...init } = options;
  const headers = { 'Content-Type':'application/json' };
  if (protectedRoute) {
    const { data } = await auth.token();
    if (!data?.token) throw new Error('Sign in again to continue');
    headers.Authorization = 'Bearer ' + data.token;
  }
  let response;
  try { response = await fetch(base + '/api' + path, { ...init, headers, body:body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('The booking server is unavailable. Please try again shortly.'); }
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function useResource(path, access, revision = 0) {
  const [state,setState] = useState({ data:null, error:'' });
  useEffect(() => {
    if (!path) return;
    let active = true;
    setState({data:null,error:''});
    api(path, {private:access}).then(data => { if(active) setState({data,error:''}); })
      .catch(err => { if(active) setState({data:null,error:err.message}); });
    return () => { active = false; };
  }, [path,access,revision]);
  return state;
}
function Cards({ resource, featured }) {
  if(resource.error) return <p role="alert">{resource.error}</p>;
  if(!resource.data) return <p role="status">Loading services…</p>;
  const rows = featured ? resource.data.slice(0,6) : resource.data;
  if(!rows.length) return <p>No matching services.</p>;
  return <div className="grid">{rows.map(row => <article className="card" key={row._id}>
    {row.image && <img src={row.image} alt="" />}
    <div className="card-body"><small>{row.category}</small><h3>{row.serviceName}</h3><p>{row.description}</p>
    <p><strong>{money(row.price)}</strong> · {row.duration} min</p>
    <Link href={'/services/'+row._id}>View details →</Link></div>
  </article>)}</div>;
}
function Catalog({ home }) {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('');
  const queryCategory=useSearchParams().get('category')||'';
  useEffect(()=>{setCategory(queryCategory);},[queryCategory]);
  const [sort,setSort]=useState('');
  const params = new URLSearchParams({search,category,sort});
  const resource=useResource('/services?'+params,false);
  const availableCategories=[...new Set((resource.data||[]).map(service=>service.category))];
  const heroImage=resource.data?.find(service=>service.image)?.image;
  return <>{home && <section className="hero"><div><span className="eyebrow">SALON APPOINTMENTS</span>
    <h1>Make time<br/>for yourself.</h1><p>Find your next haircut, treatment or quiet moment and book it in a few clicks.</p>
    <Link className="button" href="/services">Explore salon services ↗</Link></div><div className="hero-art" aria-hidden="true">{heroImage?<img src={heroImage} alt=""/>:"✳"}</div></section>}
    <section className="section"><h2>{home?'Featured services':'Browse services'}</h2>
    {!home && <div className="filters"><input aria-label="Search by name" placeholder="Search services" value={search} onChange={e=>setSearch(e.target.value)}/>
    <select aria-label="Category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
    <select aria-label="Sort by price" value={sort} onChange={e=>setSort(e.target.value)}><option value="">Latest</option><option value="asc">Price low to high</option><option value="desc">Price high to low</option></select></div>}
    <Cards resource={resource} featured={home}/></section>
    {home && <><section className="section"><h2>Browse by category</h2><div className="chips">{availableCategories.map(c=><Link key={c} href={'/services?category='+encodeURIComponent(c)}>{c}</Link>)}</div></section>
    <section className="section"><h2>How booking works</h2><p>Choose a service, request a time, and pay once the salon confirms your appointment.</p></section></>}</>;
}
function Login({ signup, notify }) {
  const router=useRouter();
  async function submit(e) {
    e.preventDefault(); const form=Object.fromEntries(new FormData(e.currentTarget));
    if(signup && !/^(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(form.password)) return notify('Use at least six characters with uppercase and lowercase letters');
    try {
      const result=signup?await auth.signUp.email({...form,image:form.image||undefined}):await auth.signIn.email(form);
      if(result.error) throw new Error(result.error.message); notify(signup?'Account created':'Signed in');
      const session=await auth.getSession();
      router.replace(session.data?.user?.role==='admin'?'/dashboard/admin':'/dashboard/customer');
    } catch(err){notify(err.message);}
  }
  return <section className="section narrow"><h1>{signup?'Create an account':'Sign in'}</h1><form onSubmit={submit}>
    {signup&&<label>Full name<input name="name" required/></label>}<label>Email<input name="email" type="email" required/></label>
    <label>Password<input name="password" type="password" required/></label>{signup&&<label>Profile image URL<input name="image" type="url"/></label>}
    <button>{signup?'Sign up':'Sign in'}</button><button type="button" className="secondary" onClick={async()=>{try {const result=await auth.signIn.social({provider:'google',callbackURL:location.origin+'/dashboard'});if(result.error)notify(result.error.message);}catch(err){notify(err.message);}}}>Continue with Google</button>
  </form></section>;
}
function Details({ id, user, notify }) {
  const { data,error }=useResource('/services/'+id,true);
  const [busy,setBusy]=useState(false);
  async function submit(e) {
    e.preventDefault(); const fields=Object.fromEntries(new FormData(e.currentTarget)); setBusy(true);
    try { await api('/appointments',{private:true,method:'POST',body:{...fields,serviceId:id}}); notify('Appointment requested'); }
    catch(err){notify(err.message);} finally {setBusy(false);}
  }
  if(error)return <section className="section" role="alert">{error}</section>;
  if(!data)return <p className="section" role="status">Loading service…</p>;
  return <section className="section details"><div><img src={data.image} alt=""/><h1>{data.serviceName}</h1><p>{data.description}</p><p>{money(data.price)} · {data.duration} min</p></div>
    {user.role!=='admin'&&<form onSubmit={submit}><h2>Request an appointment</h2><label>Date<input name="appointmentDate" type="date" required/></label>
    <label>Time<select name="timeSlot">{slots.map(s=><option key={s}>{s}</option>)}</select></label><label>Message<textarea name="message" maxLength={500}/></label>
    <button disabled={busy}>{busy?'Sending…':'Request appointment'}</button></form>}</section>;
}
function Profile({user,notify}) {
  return <form onSubmit={async e=>{e.preventDefault();try{const result=await auth.updateUser(Object.fromEntries(new FormData(e.currentTarget)));if(result.error)throw new Error(result.error.message);notify('Profile saved');}catch(err){notify(err.message);}}}>
    <label>Name<input name="name" defaultValue={user.name} required/></label>
    <label>Profile image URL<input name="image" type="url" defaultValue={user.image||''}/></label><button>Save profile</button></form>;
}
function Dashboard({ admin, user, notify, section }) {
  const [revision,refresh]=useState(0);
  const [current,edit]=useState(null);
  const [busy,setBusy]=useState(false);
  const bookings=useResource(admin?'/admin/appointments':'/appointments',true,revision);
  const services=useResource(admin?'/admin/services':null,true,revision);
  const users=useResource(admin?'/admin/users':null,true,revision);
  const payments=useResource(admin?'/admin/transactions':'/transactions',true,revision);
  const menu=admin?['Overview','Manage Services','Add Service','Manage Appointments','Manage Users','Transactions','My Profile']:['Overview','My Appointments','My Profile'];
  const slug=x=>x.toLowerCase().replaceAll(' ','-');
  const root='/dashboard/'+(admin?'admin':'customer');
  const action=async(path,method,body) => {setBusy(true);try{const result=await api(path,{private:true,method,body});if(result?.url)location.assign(result.url); else {notify('Changes saved');refresh(x=>x+1);}return true;}catch(err){notify(err.message);return false;}finally{setBusy(false);}};
  const counts=[['Total appointments',bookings.data?.length],...['pending','confirmed','cancelled'].map(x=>[x,bookings.data?.filter(row=>row.status===x).length])];
  if(admin)counts.push(['Registered customers',users.data?.length],['Active services',services.data?.filter(row=>row.status==='active').length],['Successful payments',payments.data?.filter(row=>row.status==='paid').length]);
  async function saveService(e){
    e.preventDefault();const form=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);
    try{
      let image=current?.image;
      if(form.file.size){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(form.file);});
        image=(await api('/admin/images',{private:true,method:'POST',body:{image:data.split(',')[1]}})).url;}
      const body={serviceName:form.serviceName,category:form.category,description:form.description,price:Number(form.price),duration:Number(form.duration),status:form.status,image};
      if(await action('/admin/services'+(current?'/' + current._id:''),current?'PATCH':'POST',body)){edit(null);}
    }catch(err){notify(err.message);}finally{setBusy(false);}
  }
  const entry=current||empty;
  return <div className="dashboard"><aside><h2>{admin?'Admin':'Customer'}</h2>{menu.map(x=><Link key={x} href={root+'/'+slug(x)}>{x}</Link>)}</aside>
    <section className="dashboard-main"><h1>{menu.find(x=>slug(x)===section)||'Overview'}</h1>
    {Object.entries({bookings,services,users,payments}).map(([k,v])=>v.error&&<p role="alert" key={k}>{v.error}</p>)}
    {(!section||section==='overview')&&<div className="grid">{counts.map(([label,count])=><article className="card card-body" key={label}><small>{label}</small><h2>{count??'…'}</h2></article>)}</div>}
    {section==='my-profile'&&<Profile user={user} notify={notify}/>}
    {['manage-appointments','my-appointments'].includes(section)&&<div className="records">{bookings.data?.map(row=><article className="card card-body" key={row._id}>
      {row.image&&<img className='appointment-image' src={row.image} alt=''/>}<h3>{row.serviceName}</h3>{admin&&<p>{row.customerName} · {row.customerEmail}</p>}<p>{row.category} · {row.appointmentDate} · {row.timeSlot} · {money(row.servicePrice)}</p><p><span className="badge">{row.status}</span> <span className="badge">{row.paymentStatus}</span></p>
      <details><summary>Booking details</summary><p>Requested {new Date(row.createdAt).toLocaleDateString()}</p><p>{row.message||'No message'}</p></details>
      <div className="actions">{admin&&row.status==='pending'&&<button disabled={busy} onClick={()=>action('/admin/appointments/'+row._id,'PATCH',{status:'confirmed'})}>Confirm</button>}
      {(row.status==='pending'||admin&&row.status==='confirmed')&&<button className="secondary" disabled={busy} onClick={()=>action((admin?'/admin/appointments/':'/appointments/')+row._id+(admin?'':'/cancel'),'PATCH',admin?{status:'cancelled'}:undefined)}>Cancel</button>}
      {!admin&&row.status==='confirmed'&&row.paymentStatus==='unpaid'&&<button disabled={busy} onClick={()=>action('/appointments/'+row._id+'/checkout','POST')}>Pay now</button>}</div>
    </article>)}{bookings.data?.length===0&&<p>No appointments yet.</p>}</div>}
    {admin&&section==='manage-services'&&services.data?.map(row=><article className="card card-body" key={row._id}><h3>{row.serviceName}</h3><p>{row.status} · {money(row.price)}</p>
      <div className="actions"><Link className="button" href={root+'/add-service'} onClick={()=>edit(row)}>Edit</Link><button className="secondary" onClick={()=>action('/admin/services/'+row._id,'PATCH',{...row,status:row.status==='active'?'inactive':'active'})}>{row.status==='active'?'Deactivate':'Activate'}</button>
      <details><summary>Delete service</summary><button onClick={()=>action('/admin/services/'+row._id,'DELETE')}>Confirm deletion</button></details></div></article>)}
    {admin&&section==='add-service'&&<form key={current?._id||'new'} onSubmit={saveService}><label>Service name<input name="serviceName" required defaultValue={entry.serviceName}/></label>
      <label>Category<select name="category" defaultValue={entry.category}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Description<textarea name="description" required defaultValue={entry.description}/></label>
      <label>Price<input name="price" type="number" min=".01" step=".01" required defaultValue={entry.price}/></label>
      <label>Minutes<input name="duration" type="number" min="1" required defaultValue={entry.duration}/></label>
      <label>Image<input name="file" type="file" accept="image/*" required={!current}/></label>
      <label>Status<select name="status" defaultValue={entry.status}><option>active</option><option>inactive</option></select></label>
      <button disabled={busy}>{busy?'Saving…':current?'Update service':'Add service'}</button></form>}
    {admin&&section==='manage-users'&&users.data?.map(row=><article className="card card-body" key={row._id}><h3>{row.name}</h3><p>{row.email}</p><button disabled={busy} onClick={()=>action('/admin/users/'+row._id,'PATCH',{blocked:!row.banned})}>{row.banned?'Unblock':'Block'}</button></article>)}
    {!admin&&section==='my-appointments'&&<section className="payment-history"><h2>Payment history</h2>
      {!payments.data&&!payments.error&&<p role="status">Loading payments...</p>}
      {payments.data?.length===0&&<p>No transactions yet.</p>}
      {payments.data?.map(row=><article className="card card-body" key={row._id}>
        <h3>{row.appointment?.serviceName||'Salon appointment'}</h3>
        <p>{(row.amount/100).toFixed(2)} {row.currency.toUpperCase()} · {new Date(row.createdAt).toLocaleDateString()}</p>
        <span className="badge">{row.status}</span>
      </article>)}</section>}
    {admin&&section==='transactions'&&payments.data?.map(row=><article className="card card-body" key={row._id}><h3>{row.appointment?.serviceName}</h3><p>{row.appointment?.customerName} · {row.appointment?.appointmentDate}</p><p>{(row.amount/100).toFixed(2)} {row.currency.toUpperCase()} · {row.status} · {new Date(row.createdAt).toLocaleDateString()}</p><small>{row.stripeSessionId}</small></article>)}
  </section></div>;
}
export default function SalonBook(){
  const path=usePathname();const router=useRouter();
  const {data:session,isPending}=auth.useSession();const user=session?.user;
  const [toast,notify]=useState('');
  const [main,sub,section]=path.split('/').filter(Boolean);
  const dashboard=main==='dashboard';const details=main==='services'&&!!sub;
  const admin=user?.role==='admin';
  const dash='/dashboard/'+(admin?'admin':'customer');
  useEffect(()=>{if(!toast)return;const timeout=setTimeout(()=>notify(''),3800);return()=>clearTimeout(timeout);},[toast]);
  useEffect(()=>{if(isPending)return;if((dashboard||details)&&!user)router.replace('/sign-in');else if(dashboard&&sub!==(admin?'admin':'customer'))router.replace(dash);},[isPending,user,dashboard,details,sub,admin,dash,router]);
  return <><header><Link href="/" className="logo"><span>✳</span> SalonBook</Link><nav><Link href="/">Home</Link><Link href="/services">Browse Services</Link>
    {user?<details><summary>{user.name}</summary><div><Link href={dash}>Dashboard</Link><button className="secondary" onClick={async()=>{await auth.signOut();router.push('/');}}>Logout</button></div></details>:<><Link href="/sign-in">Sign In</Link><Link href="/sign-up" className="button">Sign Up</Link></>}</nav></header>
    <main><Suspense fallback={<p className="section">Loading services…</p>}>{!main&&<Catalog home/>}{main==='services'&&!details&&<Catalog/>}</Suspense>{details&&(user?<Details id={sub} user={user} notify={notify}/>:<p className="section">Checking session…</p>)}
    {['sign-in','sign-up'].includes(main)&&<Login signup={main==='sign-up'} notify={notify}/>}
    {dashboard&&(user&&sub===(admin?'admin':'customer')?<Dashboard admin={admin} user={user} notify={notify} section={section}/>:<p className="section">Checking access…</p>)}
    {main==='payment'&&<section className="section"><h1>{sub==='success'?'Payment received':'Checkout cancelled'}</h1><p>{sub==='success'?'Stripe verification will update your booking shortly.':'You can return to your appointment and try again.'}</p><Link className="button" href="/dashboard/customer/my-appointments">My appointments</Link></section>}</main>
    <footer><div><Link href="/" className="logo">SalonBook</Link><p>Salon appointments made simple.</p></div><div><Link href="/services">Browse services</Link><p><Link href="/sign-in">Sign in</Link></p><p>Dhaka, Bangladesh · 9am–6pm</p><p>hello@salonbook.example</p></div><small>© SalonBook</small></footer>
    {toast&&<div className="toast" role="status">{toast}</div>}</>;
}



