"use client";

import { useEffect, useState } from "react";
import { browserClient } from "../../lib/supabase";

const sb = browserClient();

export default function Desk() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pub, setPub] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session]);

  async function load() {
    const { data } = await sb
      .from("kettle_notes")
      .select("*")
      .eq("author_id", session.user.id)
      .order("created_at", { ascending: false });
    setNotes(data || []);
  }

  async function submitAuth(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const h = (handle || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
          await sb.from("kettle_profiles").insert({
            id: data.user.id,
            handle: h || `room${data.user.id.slice(0, 6)}`,
            display_name: handle || h,
          });
        }
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote(e) {
    e.preventDefault();
    setErr("");
    if (!title.trim() || !body.trim()) return;
    const { error } = await sb.from("kettle_notes").insert({
      author_id: session.user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: pub,
    });
    if (error) setErr(error.message);
    else {
      setTitle("");
      setBody("");
      setPub(false);
      load();
    }
  }

  async function togglePublic(n) {
    await sb.from("kettle_notes").update({ is_public: !n.is_public, updated_at: new Date().toISOString() }).eq("id", n.id);
    load();
  }

  async function remove(n) {
    await sb.from("kettle_notes").delete().eq("id", n.id);
    load();
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 420, marginTop: 48 }}>
        <p className="kicker">{mode === "signin" ? "Sign in" : "Make a key"}</p>
        <h1 style={{ fontSize: 40 }}>The desk</h1>
        <p className="blurb" style={{ marginBottom: 22 }}>
          Email and a password. That is the whole system. Public slips go downstairs.
        </p>
        <form onSubmit={submitAuth}>
          {mode === "signup" && (
            <input placeholder="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          )}
          <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {err && <p className="err">{err}</p>}
          <button disabled={busy}>{busy ? "…" : mode === "signin" ? "Come in" : "Set a place"}</button>
          <button
            type="button"
            className="ghost"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need a key?" : "Already have one"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ marginTop: 40 }}>
      <p className="kicker">Your desk</p>
      <h1 style={{ fontSize: 42 }}>Write a slip</h1>
      <div className="grid">
        <form onSubmit={saveNote}>
          <input placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
          <textarea placeholder="what you actually mean" value={body} onChange={(e) => setBody(e.target.value)} maxLength={8000} />
          <label className="check">
            <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} />
            put it on the public wall
          </label>
          {err && <p className="err">{err}</p>}
          <div className="row">
            <button>Save</button>
            <button type="button" className="ghost" onClick={() => sb.auth.signOut()}>
              Leave
            </button>
          </div>
        </form>
        <div>
          {notes.length === 0 && <p className="empty">Nothing here yet.</p>}
          {notes.map((n) => (
            <article className="card" key={n.id}>
              <p className="meta">
                {n.is_public ? "on the wall" : "in the drawer"} · {new Date(n.created_at).toUTCString()}
              </p>
              <h2>{n.title}</h2>
              <p className="body">{n.body}</p>
              <div className="row" style={{ marginTop: 12 }}>
                <button type="button" className="ghost" onClick={() => togglePublic(n)}>
                  {n.is_public ? "Take down" : "Make public"}
                </button>
                <button type="button" className="ghost" onClick={() => remove(n)}>
                  Burn
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
