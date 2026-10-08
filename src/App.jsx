import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

function App() {
  const [session, setSession] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [msg, setMsg] = useState('')
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      supabase.from('doctors').select('*').then(({ data }) => setDoctors(data || []))
      loadAppointments()
    }
  }, [session])

  if (!session) return <Auth />

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  )

  async function viewSlots(doctor) {
    setSelectedDoctor(doctor)
    setMsg('')
    const { data } = await supabase
      .from('time_slots')
      .select('*')
      .eq('doctor_id', doctor.id)
      .eq('is_booked', false)
      .order('slot_date')
      .order('slot_time')
    setSlots(data || [])
  }

  async function bookSlot(slot) {
    const { error } = await supabase.from('appointments').insert({
      patient_id: session.user.id,
      doctor_id: slot.doctor_id,
      slot_id: slot.id
    })
    if (error) return setMsg(error.message)
    await supabase.from('time_slots').update({ is_booked: true }).eq('id', slot.id)
    await viewSlots(selectedDoctor)
    await loadAppointments()
    setMsg('Appointment booked!')
  }

  async function loadAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('id, slot_id, doctors(name, specialty), time_slots(slot_date, slot_time)')
      .order('created_at', { ascending: false })
    setAppointments(data || [])
  }

  async function cancelAppointment(a) {
    await supabase.from('appointments').delete().eq('id', a.id)
    await supabase.from('time_slots').update({ is_booked: false }).eq('id', a.slot_id)
    await loadAppointments()
    if (selectedDoctor) await viewSlots(selectedDoctor)
  }

  return (
    <>
      <header className="banner">
        <div className="banner-top">
          <span className="brand">🩺 MediBook</span>
          <button onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
        <h1>Book your doctor in minutes</h1>
        <p>Search trusted doctors, pick a free slot, and confirm your appointment online.</p>
      </header>

      <div>
        <h2>Find a Doctor</h2>
        <input
          placeholder="Search by name or specialty"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filtered.length === 0 && <p>No doctors found</p>}
        {filtered.map(d => (
          <div key={d.id}>
            <h3>{d.name}</h3>
            <p>{d.specialty} | {d.experience_years} yrs | ₹{d.fee}</p>
            <button onClick={() => viewSlots(d)}>View slots</button>
            {selectedDoctor?.id === d.id && (
              <div>
                {slots.length === 0 && <p>No free slots</p>}
                {slots.map(s => (
                  <button key={s.id} onClick={() => bookSlot(s)}>
                    {s.slot_date} {s.slot_time.slice(0, 5)}
                  </button>
                ))}
                <p>{msg}</p>
              </div>
            )}
          </div>
        ))}

        <h2>My Appointments</h2>
        {appointments.length === 0 && <p>No appointments yet</p>}
        {appointments.map(a => (
          <div key={a.id}>
            <p>
              {a.doctors?.name} ({a.doctors?.specialty}) on {a.time_slots?.slot_date} at {a.time_slots?.slot_time?.slice(0, 5)}
            </p>
            <button onClick={() => cancelAppointment(a)}>Cancel</button>
          </div>
        ))}
      </div>

      <footer className="footer">© 2026 MediBook · Online Doctor Appointment System</footer>
    </>
  )
}

export default App