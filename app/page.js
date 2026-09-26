import { browserClient } from "../lib/supabase";

export const revalidate = 30;

function hourKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}`;
}

export default async function Page() {
  const sb = browserClient();
  const key = hourKey();

  const { data: hour } = await sb
    .from("kettle_hours")
    .select("headline, blurb, note_id, hour_key")
    .eq("hour_key", key)
    .maybeSingle();

  let edition = hour;
  if (!edition) {
    const { data: latestHour } = await sb
      .from("kettle_hours")
      .select("headline, blurb, note_id, hour_key")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    edition = latestHour;
  }

  let featured = null;
  if (edition?.note_id) {
    const { data } = await sb
      .from("kettle_notes")
      .select("id, title, body, created_at, author_id")
      .eq("id", edition.note_id)
      .eq("is_public", true)
      .maybeSingle();
    featured = data;
  }

  const { data: wall } = await sb
    .from("kettle_notes")
    .select("id, title, body, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: archives } = await sb
    .from("kettle_hours")
    .select("hour_key, headline")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <main>
      <div className="steam" aria-hidden>
        <i /><i /><i />
      </div>
      <section className="hour">
        <p className="kicker">This hour · {edition?.hour_key || key} UTC</p>
        <h1>{edition?.headline || "The kettle is on"}</h1>
        <p className="blurb">
          {edition?.blurb ||
            "This room reprints itself every hour. Public slips go on the wall. Private ones stay at your desk."}
        </p>
      </section>

      <div className="grid">
        <div>
          <p className="kicker">The wall</p>
          {featured && (
            <article className="card" style={{ marginTop: 12, marginBottom: 16 }}>
              <p className="meta">Pinned this hour</p>
              <h2>{featured.title}</h2>
              <p className="body">{featured.body}</p>
            </article>
          )}
          {(wall || []).filter((n) => n.id !== featured?.id).length === 0 && !featured ? (
            <p className="empty" style={{ marginTop: 14 }}>
              No public slips yet. Sign in at the desk and pin one to the wall.
            </p>
          ) : (
            (wall || [])
              .filter((n) => n.id !== featured?.id)
              .map((n, i) => (
                <article className="slip" key={n.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <p className="meta">{new Date(n.created_at).toUTCString()}</p>
                  <h2 style={{ fontSize: 20 }}>{n.title}</h2>
                  <p className="body">{n.body}</p>
                </article>
              ))
          )}
        </div>
        <aside>
          <div className="card">
            <p className="kicker">How it works</p>
            <p className="body" style={{ marginTop: 10 }}>
              Make an account. Write a slip. Keep it private, or mark it public and it appears on this floor. Every hour the room writes a new headline and, when it can, pins one public slip.
            </p>
          </div>
          <div className="card">
            <p className="kicker">Past hours</p>
            {(archives || []).map((h) => (
              <p key={h.hour_key} className="meta" style={{ marginTop: 8 }}>
                {h.hour_key} — {h.headline}
              </p>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
