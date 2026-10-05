import Link from "next/link";

const SCHOOL = "https://www.dohertyijero.com.ng";

export function SiteFooter() {
  return (
    <footer className="m-foot">
      <div className="m-wrap">
        <div className="top">
          <div className="about">
            <div className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/crest.png" alt="" width={52} height={52} />
              <span>
                DMGS Old Students
                <br />
                Association
              </span>
            </div>
            <p>Connecting the old students of Doherty Memorial Grammar School, Ijero-Ekiti, across Nigeria and the diaspora.</p>
          </div>
          <div className="cols">
            <div>
              <b>Association</b>
              <Link href="/#work">Our work</Link>
              <Link href="/#accountability">Accountability</Link>
              <Link href="/#school">The school</Link>
            </div>
            <div>
              <b>Members</b>
              <Link href="/signup">Request membership</Link>
              <Link href="/login">Sign in</Link>
            </div>
            <div>
              <b>School</b>
              <a href={SCHOOL} target="_blank" rel="noopener noreferrer">School website</a>
              <a href={`${SCHOOL}/contact-us/`} target="_blank" rel="noopener noreferrer">Contact the school</a>
            </div>
          </div>
        </div>
        <div className="bottom">
          <span>© {new Date().getFullYear()} Doherty Memorial Grammar School Old Students Association</span>
          <span>Ijero-Ekiti · Nigeria</span>
        </div>
      </div>
    </footer>
  );
}
