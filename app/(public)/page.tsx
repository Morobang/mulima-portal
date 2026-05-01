import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ── DATA FETCHING ─────────────────────────────────────────
async function getPublicNotices() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('notices')
    .select('id, title, body, category, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

// ── SUBCOMPONENTS ─────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: `linear-gradient(135deg, var(--navy) 0%, #0d3660 50%, #0a2540 100%)`,
      minHeight: '92vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(30,95,158,0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(30,95,158,0.2) 0%, transparent 40%)`,
        pointerEvents: 'none',
      }} />

      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '400px', height: '400px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '280px', height: '280px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '350px', height: '350px',
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      <div className="container-school" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: '680px' }}>

          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(30,95,158,0.3)',
            border: '1px solid rgba(30,95,158,0.5)',
            borderRadius: '999px',
            padding: '6px 16px',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '7px', height: '7px',
              borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade80',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>
              Portal now open — Term 2, 2025
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 6vw, 62px)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.1,
            marginBottom: '24px',
          }}>
            Welcome to<br />
            <span style={{ color: 'var(--blue-light)' }}>Mulima Secondary</span>
            <br />School
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.7,
            marginBottom: '40px',
            maxWidth: '520px',
          }}>
            Committed to excellence in education since 1988. Access your marks,
            timetable, school fees, and notices — all in one place.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-blue btn-lg">
              Sign in to portal
            </Link>
            <Link href="/about" className="btn btn-outline-white btn-lg">
              About the school
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{
            display: 'flex', gap: '32px', marginTop: '56px',
            flexWrap: 'wrap',
          }}>
            {[
              { value: '612', label: 'Enrolled learners' },
              { value: '28',  label: 'Educators' },
              { value: '1988', label: 'Established' },
              { value: '4',   label: 'User portals' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{
                  fontSize: '28px', fontWeight: 700, color: '#fff',
                  fontFamily: 'var(--font-display)',
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '120px',
        background: 'linear-gradient(to bottom, transparent, #fff)',
        pointerEvents: 'none',
      }} />
    </section>
  )
}

function PortalCards() {
  const portals = [
    {
      role: 'Student',
      icon: '🎓',
      color: 'var(--blue)',
      bg: 'var(--blue-pale)',
      description: 'View your marks, timetable, attendance, homework, notices, and wellbeing resources.',
      features: ['Marks & reports', 'Timetable', 'Attendance', 'Homework tracker', 'School calendar'],
    },
    {
      role: 'Parent',
      icon: '👨‍👩‍👧',
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      description: "Monitor your child's academic progress, fees, attendance, and communicate with educators.",
      features: ['Academic progress', 'School fees', 'Attendance alerts', 'Report cards', 'Message teachers'],
    },
    {
      role: 'Teacher',
      icon: '📚',
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
      description: 'Take attendance, enter marks, write report comments, set homework, and message parents.',
      features: ['Attendance register', 'Mark register', 'Report comments', 'Parent messaging', 'Resources'],
    },
    {
      role: 'Administration',
      icon: '🏫',
      color: 'var(--navy)',
      bg: 'var(--blue-light)',
      description: 'Full school oversight — analytics, enrolment, fees, staff, timetable, and communications.',
      features: ['School analytics', 'Fee management', 'Staff management', 'Enrolment', 'Notices & comms'],
    },
  ]

  return (
    <section style={{ padding: '96px 0', background: '#fff' }}>
      <div className="container-school">

        {/* Section heading */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--blue-pale)',
            color: 'var(--blue)',
            fontSize: '12px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '6px 16px', borderRadius: '999px',
            marginBottom: '16px',
          }}>
            One portal, four experiences
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 4vw, 38px)',
            color: 'var(--navy)',
            marginBottom: '14px',
          }}>
            Built for everyone at Mulima
          </h2>
          <p style={{
            fontSize: '16px', color: 'var(--gray-mid)',
            maxWidth: '520px', margin: '0 auto', lineHeight: 1.7,
          }}>
            Whether you are a learner, parent, teacher, or administrator —
            your personalised dashboard is waiting.
          </p>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {portals.map(portal => (
            <div
              key={portal.role}
              className="card card-hover"
              style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px',
                background: portal.bg,
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
              }}>
                {portal.icon}
              </div>

              {/* Title */}
              <div>
                <h3 style={{ fontSize: '17px', color: 'var(--navy)', marginBottom: '6px' }}>
                  {portal.role} Portal
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--gray-mid)', lineHeight: 1.6 }}>
                  {portal.description}
                </p>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {portal.features.map(f => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', color: 'var(--gray-dark)',
                  }}>
                    <span style={{ color: portal.color, fontSize: '11px' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontSize: '13.5px', fontWeight: 500,
                    color: portal.color, textDecoration: 'none',
                  }}
                >
                  Sign in as {portal.role} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  const stats = [
    { value: '612', label: 'Enrolled learners', icon: '👩‍🎓' },
    { value: '28',  label: 'Qualified educators', icon: '👩‍🏫' },
    { value: '37',  label: 'Years of excellence', icon: '🏆' },
    { value: '6',   label: 'Learning grades', icon: '📖' },
    { value: '94%', label: 'Average attendance', icon: '✅' },
    { value: '82%', label: 'Matric pass rate', icon: '🎓' },
  ]

  return (
    <section style={{
      background: 'var(--navy)',
      padding: '64px 0',
    }}>
      <div className="container-school">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '40px',
          textAlign: 'center',
        }}>
          {stats.map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{stat.icon}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '32px', fontWeight: 700,
                color: '#fff', lineHeight: 1,
                marginBottom: '6px',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section style={{ padding: '96px 0', background: 'var(--gray-light)' }}>
      <div className="container-school">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '64px',
          alignItems: 'center',
        }}>
          {/* Text */}
          <div>
            <div style={{
              display: 'inline-block',
              background: 'var(--blue-pale)',
              color: 'var(--blue)',
              fontSize: '12px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '6px 16px', borderRadius: '999px',
              marginBottom: '20px',
            }}>
              About our school
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3.5vw, 36px)',
              color: 'var(--navy)',
              marginBottom: '20px',
              lineHeight: 1.2,
            }}>
              Excellence in education<br />since 1988
            </h2>
            <p style={{
              fontSize: '15px', color: 'var(--gray-mid)',
              lineHeight: 1.8, marginBottom: '20px',
            }}>
              Mulima Secondary School is a public secondary school situated in Thohoyandou,
              Limpopo Province. We are committed to providing quality education that empowers
              learners to reach their full potential — academically, socially, and personally.
            </p>
            <p style={{
              fontSize: '15px', color: 'var(--gray-mid)',
              lineHeight: 1.8, marginBottom: '32px',
            }}>
              Our dedicated team of 28 educators work tirelessly to ensure every learner
              from Grade 8 to Grade 12 receives the support, resources, and guidance they
              need to succeed in a changing world.
            </p>
            <Link href="/about" className="btn btn-primary">
              Learn more about us
            </Link>
          </div>

          {/* Info cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                icon: '🎯',
                title: 'Our Mission',
                text: 'To provide quality, inclusive education that develops confident, capable, and responsible citizens.',
              },
              {
                icon: '👁️',
                title: 'Our Vision',
                text: 'A fully connected school community where every learner achieves their highest potential.',
              },
              {
                icon: '⭐',
                title: 'Our Values',
                text: 'Excellence · Integrity · Respect · Ubuntu · Hard work · Community',
              },
            ].map(item => (
              <div
                key={item.title}
                className="card"
                style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
              >
                <div style={{
                  fontSize: '22px', width: '44px', height: '44px',
                  background: 'var(--blue-pale)', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '4px', fontSize: '14px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--gray-mid)', lineHeight: 1.6 }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function NoticesSection({ notices }: { notices: any[] }) {
  const categoryColours: Record<string, string> = {
    urgent:   '#b91c1c',
    academic: '#1e5f9e',
    finance:  '#c9920e',
    sport:    '#1e7a4a',
    general:  '#6b7280',
    events:   '#7c3aed',
    culture:  '#0891b2',
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  return (
    <section style={{ padding: '96px 0', background: '#fff' }}>
      <div className="container-school">

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: '40px',
          flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: 'var(--blue-pale)', color: 'var(--blue)',
              fontSize: '12px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '6px 16px', borderRadius: '999px',
              marginBottom: '14px',
            }}>
              Latest from the school
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 3.5vw, 36px)',
              color: 'var(--navy)',
            }}>
              Notices &amp; announcements
            </h2>
          </div>
          <Link href="/notices" className="btn btn-outline btn-sm">
            View all notices →
          </Link>
        </div>

        {notices.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px',
            color: 'var(--gray-mid)', fontSize: '15px',
          }}>
            No public notices at this time.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {notices.map(notice => (
              <div key={notice.id} className="card card-hover" style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', marginBottom: '12px',
                }}>
                  <span
                    className="badge"
                    style={{
                      background: `${categoryColours[notice.category] ?? '#6b7280'}18`,
                      color: categoryColours[notice.category] ?? '#6b7280',
                      textTransform: 'capitalize',
                    }}
                  >
                    {notice.category}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--gray-mid)' }}>
                    {formatDate(notice.created_at)}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '15px', fontWeight: 600,
                  color: 'var(--navy)', marginBottom: '8px', lineHeight: 1.3,
                }}>
                  {notice.title}
                </h3>
                <p style={{
                  fontSize: '13.5px', color: 'var(--gray-mid)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}>
                  {notice.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section style={{ padding: '96px 0', background: 'var(--gray-light)' }}>
      <div className="container-school">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            color: 'var(--navy)', marginBottom: '12px',
          }}>
            Get in touch
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--gray-mid)', maxWidth: '400px', margin: '0 auto' }}>
            Our admin office is open Monday to Friday, 07:00 to 16:00.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          maxWidth: '900px',
          margin: '0 auto',
        }}>
          {[
            { icon: '📍', title: 'Address', lines: ['123 School Street', 'Thohoyandou, 0950', 'Limpopo Province'] },
            { icon: '📞', title: 'Phone', lines: ['015 000 1234', 'Mon–Fri · 07:00–16:00'] },
            { icon: '📧', title: 'Email', lines: ['info@mulima.edu.za', 'admin@mulima.edu.za'] },
            { icon: '🌐', title: 'Portal', lines: ['Sign in at /login', 'Support: help@mulima.edu.za'] },
          ].map(item => (
            <div key={item.title} className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{
                fontWeight: 600, color: 'var(--navy)',
                marginBottom: '8px', fontSize: '14px',
              }}>
                {item.title}
              </div>
              {item.lines.map(line => (
                <div key={line} style={{
                  fontSize: '13.5px', color: 'var(--gray-mid)', lineHeight: 1.8,
                }}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABanner() {
  return (
    <section style={{
      background: `linear-gradient(135deg, var(--blue) 0%, var(--navy) 100%)`,
      padding: '80px 0',
      textAlign: 'center',
    }}>
      <div className="container-school">
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(24px, 4vw, 40px)',
          color: '#fff', marginBottom: '16px',
        }}>
          Ready to access your portal?
        </h2>
        <p style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.75)',
          marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px',
        }}>
          Sign in with your school credentials to access marks, timetables,
          fees, notices, and more.
        </p>
        <Link href="/login" className="btn btn-lg" style={{
          background: '#fff',
          color: 'var(--navy)',
          fontWeight: 600,
        }}>
          Sign in to your portal
        </Link>
      </div>
    </section>
  )
}

// ── PAGE ──────────────────────────────────────────────────
export default async function HomePage() {
  const notices = await getPublicNotices()

  return (
    <>
      <HeroSection />
      <PortalCards />
      <StatsBar />
      <AboutSection />
      <NoticesSection notices={notices} />
      <ContactSection />
      <CTABanner />
    </>
  )
}