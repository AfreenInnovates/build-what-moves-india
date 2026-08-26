/**
 * What EPFO does today, and what this does instead.
 *
 * Every claim on the left-hand side is something we checked ourselves against
 * EPFO's own pages or its own circulars, and each one carries where it came from
 * and when it was checked. Nothing here is from memory or from a blog post
 * summarising a circular - where we could only find a secondary source, the row
 * says so.
 *
 * This matters more than it might look. The whole argument of this project is
 * that the current experience is harder than it needs to be; making that case
 * with something inaccurate would be both dishonest and self-defeating.
 */
export interface Claim {
  /** the thing being compared */
  feature: string;
  /** what EPFO does, stated so it could be checked */
  epfo: string;
  /** what this prototype does */
  ours: string;
  /** where the EPFO statement comes from */
  source: string;
  /** first-hand means we opened it ourselves */
  kind: 'first-hand' | 'circular' | 'published';
  checked: string;
}

export const CHECKED_ON = '26 August 2026';

export const CLAIMS: Claim[] = [
  {
    feature: 'Where the service lives',
    epfo:
      'The main site has been rebuilt and looks new. But the things you actually do still happen on other websites. Activating your UAN and checking your passbook are on two different sites. Complaints are on a third. Activation is in a phone app.',
    ours: 'One place. Every step, every record and every message about your claim, on one site, with one login.',
    source: 'The links behind the tiles on the epfo.gov.in home page, read directly.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'Signing in',
    epfo:
      'You log in with your UAN and password. Then to see your passbook you go to a different website and log in again. They are so separate that each one had its own version number on the day we checked.',
    ours: 'You log in once. Your case stays at a link you can come back to.',
    source: 'unifiedportal-mem.epfindia.gov.in and passbook.epfindia.gov.in, opened directly.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'Activating your UAN',
    epfo:
      'The member portal carries a notice marked NEW: "Dear Member, UAN activation for existing UANs and generation of new UANs can be done through the UMANG app." Activation uses Aadhaar face authentication in UMANG, which needs a second app, Aadhaar Face RD, installed alongside it.',
    ours: 'We tell you both apps you need before you start, and which phone number the code will go to. And we show you the screen first, so you already know every question it will ask.',
    source: 'Notice on the member portal home page.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'Naming who receives your money',
    epfo:
      'The member portal states: "Filing of nominations by members is mandatory as per EPF Scheme, 2026. E-Nominations can be filed and updated during service period." It is not presented as a prerequisite for claiming, and nothing warns you before you try.',
    ours: 'It is one of the seven things on your first page, with the reason said plainly: until you do it, the claim page will not open.',
    source: 'Notice on the member portal home page.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'How often claims are turned down',
    epfo:
      'In 2024-25 people sent about 796 lakh claims and about 174 lakh came back refused - roughly 1 in 5. The year before it was closer to 1 in 4. It is getting better.',
    ours: 'We check the things that cause those refusals before you send anything, not after.',
    source: 'EPFO annual report figures, as reported by Dataful and FACTLY. Secondary source; we did not obtain the annual report itself.',
    kind: 'published',
    checked: CHECKED_ON,
  },
  {
    feature: 'How long settlement takes',
    epfo:
      'EPFO’s own question list asks what to do if your money has not come in 20 days - so 20 days is the time they aim for, once a claim actually goes through.',
    ours: 'A number of working days for your case, worked out from what is still left and what has to happen first.',
    source: 'FAQ heading on the epfo.gov.in home page.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'Automatic settlement',
    epfo:
      'On 24 June 2025 EPFO raised the auto-settlement limit for advance claims from ₹1 lakh to ₹5 lakh, with those claims settled within about 72 hours. By 30 October 2025, 71.22 per cent of advance claims were being settled automatically. This applies to ADVANCES - money taken while still a member - not to final settlement after you leave a job.',
    ours: 'Most of our six have left their job and want all their money, which the fast route does not cover. So we say which route you are on instead of letting you assume the quick one.',
    source: 'PIB press release 24 June 2025, and EPFO’s own post on X dated 30 October 2025.',
    kind: 'published',
    checked: CHECKED_ON,
  },
  {
    feature: 'Correcting your name or date of birth',
    epfo:
      'The Joint Declaration circular of 16 January 2025 sorts members into three groups. A: UAN generated from Aadhaar on or after 01/10/2017 - file online. B: UAN generated before that date but with Name, DOB and Gender validated by UIDAI - also file online. C: not Aadhaar-validated, or no UAN - physical filing only. Each parameter needs two documents, or one if submitted through DigiLocker, or none where the member can make the change themselves.',
    ours: 'We work out which of those three groups you are in and tell you. That one fact decides whether this takes days or weeks, and nothing on the portal says it.',
    source: 'EPFO circular WSU/JointDeclaration/E-54018/2024-25/006, 16 January 2025, read from a copy circulated by the Karnataka Employers’ Association.',
    kind: 'circular',
    checked: CHECKED_ON,
  },
  {
    feature: 'Proving your date of birth',
    epfo:
      'Aadhaar was removed from the list of documents accepted as proof of date of birth by circular WSU/2024/1/UIDAI Matter/4090 of 16 January 2024, following UIDAI, because under the Aadhaar Act 2016 an Aadhaar number establishes identity but is not by itself proof of date of birth. A birth certificate, school or board certificate, passport or PAN is needed instead.',
    ours: 'We treat a wrong name and a wrong date of birth as two different problems. One can be fixed free from your Aadhaar. The other needs a paper you may not still have.',
    source: 'EPFO circular WSU/2024/1/UIDAI Matter/4090, 16 January 2024, as reported by Business Standard, Business Today and TaxGuru.',
    kind: 'circular',
    checked: CHECKED_ON,
  },
  {
    feature: 'Checking your balance',
    epfo:
      'The passbook site offers a missed call to 9966044425, or an SMS reading EPFOHO UAN to 7738299899, as alternatives to signing in.',
    ours: 'Your balance is on the page, with every month behind it and the empty months marked.',
    source: 'Banner on passbook.epfindia.gov.in.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
  {
    feature: 'When something goes wrong',
    epfo:
      'Grievances go to a separate service at epfigms.gov.in, linked from the EPFO home page, with its own registration.',
    ours: 'We write the complaint for you, naming what failed and when, and tell you what to do next if nobody replies.',
    source: 'Grievance link on the epfo.gov.in home page.',
    kind: 'first-hand',
    checked: CHECKED_ON,
  },
];

/** What is genuinely working here, and what is a rebuild standing in for the real thing. */
export const HONESTY: { thing: string; state: string; detail: string }[] = [
  {
    thing: 'The seven conditions and the day count',
    state: 'Real',
    detail:
      'The seven conditions are written down as rules, and the order comes from which one blocks which. The number is worked out, never typed in, and never guessed by an AI.',
  },
  {
    thing: 'Your progress',
    state: 'Real',
    detail:
      'Saved in a real database. Anything you finish is still there when you come back, and the reset button on the case list puts everything back to the start.',
  },
  {
    thing: 'Saathi, the assistant',
    state: 'Real',
    detail:
      'Answers about your case, in the language you type or speak. It is given your facts and is not allowed to make up a number - every figure it says comes from the rules.',
  },
  {
    thing: 'UMANG face check',
    state: 'Built here instead',
    detail:
      'Today you have to leave, install two apps and come back. We think this should be one step inside the page, through UMANG’s own connection, so we built that step here to show it working. The face check itself is not real: no camera opens, nothing is sent to UIDAI, no OTP goes out.',
  },
  {
    thing: 'DigiLocker documents',
    state: 'Built here instead',
    detail:
      'Today you go to DigiLocker, fetch a file and bring it back. We think the page should just ask DigiLocker for it, with your permission, so you never leave. We built that step here to show what it would feel like. No file is really shared and DigiLocker is never contacted.',
  },
  {
    thing: 'The link to your employer',
    state: 'Built here instead',
    detail:
      'This one really works. Send the link, your old company opens it, ticks the box, and your claim moves the same second. In a real version the link would be locked to them and would expire; here anyone with the link can open it, and that page says so.',
  },
  {
    thing: 'EPFO and the employer portal',
    state: 'Not connected',
    detail:
      'EPFO has no open connection for anyone to use, and members cannot see the employer site at all. Nothing here reaches EPFO, and no claim is really sent.',
  },
  {
    thing: 'Identity and payment',
    state: 'Not connected',
    detail:
      'No Aadhaar check, no bank check, no money moves. There is no real Aadhaar, PAN or bank number anywhere in this project.',
  },
  {
    thing: 'The people and their documents',
    state: 'Invented',
    detail:
      'Six made-up people, each stuck for a different real reason. Every document is made by us, stamped SPECIMEN, and the numbers on them are deliberately not valid.',
  },
  {
    thing: 'The waiting times',
    state: 'From EPFO where published, our estimate where not',
    detail:
      'Each waiting time is stored with where it came from. If EPFO published it, we use their number. If it is only what members report, we say so.',
  },
];
