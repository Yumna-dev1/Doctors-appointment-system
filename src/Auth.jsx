  import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth() {
  const [isSignup, setIsSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setMessage('')
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return setMessage(error.message)
      const { error: pErr } = await supabase
        .from('patients')
        .insert({ id: data.user.id, name })
      if (pErr) setMessage(pErr.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
  }

  return (
    <>
      <header className="banner">
        <div className="banner-top">
          <span className="brand">🩺 MediBook</span>
        </div>
        <h1>Book your doctor in minutes</h1>
        <p>Search trusted doctors, pick a free slot, and confirm your appointment online.</p>
      </header>

      <div className="auth-box">
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
        {isSignup && (
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={handleSubmit}>{isSignup ? 'Sign Up' : 'Login'}</button>
        <p>{message}</p>
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Already have an account? Login' : 'New here? Sign Up'}
        </button>
      </div>

      <footer className="footer">© 2026 MediBook · Online Doctor Appointment System</footer>
    </>
  )
}

export default Auth