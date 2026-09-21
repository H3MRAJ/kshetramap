// Seeds a single, clearly-marked DEMO constituency_profiles document for
// AC-178 (Mokama, Bihar) via the real upsertProfile() repo function — no
// hand-rolled Mongo write bypassing its deep-merge/audit-diff-tested code
// path. Every fact's `source` is honest about being demo content; the
// top-level `demo: true` flag is the machine-filterable safeguard. Neither
// is a substitute for the other — see profileRepo.ts's `demo` field doc.
//
// Content below is plausible-for-Mokama-flavored placeholder copy, not
// verified/curated fact-checking. Do not treat any of it as a real citation
// (the "Demo seed data — not a real citation" source string on every Fact
// says so explicitly) — it exists purely so later tasks (API routes, the
// profile editor, the dossier page) have realistic-looking content to build
// and test against before real curation happens.
//
// TypeScript over Python, same reasoning as scripts/seed-admin.ts (Phase A):
// reuse the app's own, already-tested repo logic (upsertProfile()'s
// section-wise deep merge) rather than reimplement/bypass it in a second
// language.
import { getClient } from "../src/lib/db/mongo";
import { ensureProfileIndexes, upsertProfile, type ProfilePatch } from "../src/lib/profile/profileRepo";

const AC_NO = 178; // Mokama, Patna district, Bihar — see public/data/ac-178/meta.json
const DEMO_SOURCE = "Demo seed data — not a real citation";
const SEEDED_BY = "seed-demo-profile-script";

const patch: ProfilePatch = {
  demo: true,
  snapshot: {
    area_note: { value: "Roughly 1,050 sq km spanning riverine and upland blocks", source: DEMO_SOURCE, as_of: "2023" },
    hq_note: { value: "Mokama town, on NH-31 along the Ganga", source: DEMO_SOURCE, as_of: "2023" },
    blocks: { value: "Mokama and Ghoswori blocks", source: DEMO_SOURCE, as_of: "2023" },
    panchayats: { value: "18 gram panchayats", source: DEMO_SOURCE, as_of: "2023" },
    literacy_pct: { value: 61.5, source: DEMO_SOURCE, as_of: "2011" },
    sex_ratio: { value: 894, source: DEMO_SOURCE, as_of: "2011" },
  },
  social: {
    caste_notes: [
      {
        group: "Bhumihar",
        note: "Historically influential landholding community in the constituency's upland villages",
        source: DEMO_SOURCE,
        as_of: "2022",
        granularity: "district",
      },
      {
        group: "Yadav",
        note: "Sizeable population share, concentrated in several panchayats along the river belt",
        source: DEMO_SOURCE,
        as_of: "2022",
        granularity: "district",
      },
      {
        group: "Extremely Backward Classes (EBC)",
        note: "Composite of several smaller EBC groups; no single group forms a majority",
        source: DEMO_SOURCE,
        as_of: "2022",
        granularity: "qualitative",
      },
    ],
    religion_note: { value: "Predominantly Hindu, with a Muslim minority concentrated in Mokama town", source: DEMO_SOURCE, as_of: "2011" },
    migration_note: { value: "Seasonal out-migration of male agricultural labour to Delhi/Punjab in the lean farming months", source: DEMO_SOURCE, as_of: "2022" },
    communities: [
      { name: "Mallah (boatmen/fisherfolk)", name_hi: "मल्लाह", note: "Concentrated along the Ganga diara villages" },
      { name: "Trading community, Mokama bazaar", note: "Small grain and hardware traders clustered around the main market" },
      { name: "Diara farming households", note: "Cultivate the seasonally-flooded river islands (diaras)" },
    ],
    institutions: [
      { name: "Mokama Degree College", type: "college", note: "Main higher-education institution in the constituency" },
      { name: "Sub-Divisional Hospital, Mokama", type: "hospital", note: "Primary referral hospital for the block" },
      { name: "Government Girls High School, Mokama", type: "school" },
    ],
  },
  economic: {
    occupations: [
      { label: "Agriculture (paddy, maize, pulses)", label_hi: "कृषि", value: "Dominant livelihood", source: DEMO_SOURCE, as_of: "2022" },
      { label: "Fishing and boat transport", label_hi: "मछली पालन", value: "Significant along the Ganga diara belt", source: DEMO_SOURCE, as_of: "2022" },
      { label: "Petty trade and shopkeeping", value: "Concentrated in Mokama town market", source: DEMO_SOURCE, as_of: "2022" },
      { label: "Migrant wage labour", value: "Seasonal, outside the constituency", source: DEMO_SOURCE, as_of: "2022" },
    ],
    agriculture: { value: "Paddy and maize on upland fields; diara land supports melon and vegetable cultivation post-flood", source: DEMO_SOURCE, as_of: "2022" },
    industry: { value: "Limited formal industry; mostly agro-processing and small rice mills", source: DEMO_SOURCE, as_of: "2022" },
    schemes: [
      { name: "MGNREGA", coverage_note: "Widely accessed in diara panchayats during the lean agricultural season", source: DEMO_SOURCE, as_of: "2023" },
      { name: "PM Awas Yojana (Gramin)", name_hi: "प्रधानमंत्री आवास योजना (ग्रामीण)", coverage_note: "Ongoing rollout across several panchayats", source: DEMO_SOURCE, as_of: "2023" },
      { name: "Jal Jeevan Mission", coverage_note: "Piped water coverage reported as partial, concentrated near the town", source: DEMO_SOURCE, as_of: "2023" },
    ],
    projects: [
      { title: "Ganga embankment strengthening near Mokama", status: "ongoing", year: 2024, note: "Flood-protection work along the diara stretch" },
      { title: "Mokama bypass road widening", status: "proposed", note: "Discussed to ease NH-31 congestion through the town" },
      { title: "Sub-divisional hospital upgrade", status: "done", year: 2022, note: "Additional ward capacity added" },
    ],
    issues: [
      { title: "Annual flooding of diara villages", rank: 1, note: "Recurs most monsoons; affects standing crops and access roads" },
      { title: "Irrigation reliability outside the diara belt", rank: 2 },
      { title: "Limited local employment outside agriculture", rank: 3 },
      { title: "River-bank erosion near riverside panchayats", rank: 4 },
      { title: "Healthcare capacity at the sub-divisional hospital", rank: 5 },
    ],
  },
  political: {
    history_note: { value: "A long-contested seat with a history of strong independent and dominant-caste-backed candidacies alongside major-party contests", source: DEMO_SOURCE, as_of: "2023" },
    key_leaders: [
      { name: "Example Sitting MLA", role: "MLA", note: "Illustrative placeholder — not a real office-holder record" },
      { name: "Example Local Party Organiser", role: "Block-level party organiser", note: "Illustrative placeholder" },
      { name: "Example Panchayat-level Leader", role: "Mukhiya", note: "Illustrative placeholder" },
    ],
    organisation_note: { value: "Booth-level organisation is described as strongest in Mokama town and weaker across the scattered diara panchayats", source: DEMO_SOURCE, as_of: "2023" },
    alliances_note: { value: "Contested historically within Bihar's shifting NDA/Mahagathbandhan alliance framework, alongside independents", source: DEMO_SOURCE, as_of: "2023" },
  },
  brief_en:
    "Mokama (AC-178) is a Ganga-riverside constituency in Patna district, Bihar, spanning both upland agricultural villages and seasonally-flooded diara land. " +
    "Agriculture and fishing dominate local livelihoods, with flooding and irrigation reliability among the most commonly cited local concerns. " +
    "This paragraph is illustrative demo copy seeded for development purposes and is not a verified political or socio-economic summary.",
  brief_hi:
    "मोकामा (एसी-178) पटना जिले, बिहार का गंगा किनारे बसा एक विधानसभा क्षेत्र है, जिसमें ऊपरी कृषि गाँव और मौसमी बाढ़ग्रस्त दियारा भूमि दोनों शामिल हैं। " +
    "यहाँ की आजीविका मुख्यतः कृषि और मछली पालन पर निर्भर है, तथा बाढ़ और सिंचाई की विश्वसनीयता स्थानीय स्तर पर बार-बार उठाए जाने वाले मुद्दों में शामिल हैं। " +
    "यह अनुच्छेद विकास कार्य हेतु तैयार किया गया उदाहरण मात्र है और इसे सत्यापित राजनीतिक या सामाजिक-आर्थिक सारांश न माना जाए।",
};

async function main() {
  await ensureProfileIndexes();

  const { after } = await upsertProfile(AC_NO, patch, SEEDED_BY);
  console.log(`OK — demo profile ready for ac_no=${after.ac_no} (demo=${after.demo}), _id=${after._id.toString()}`);

  const client = await getClient();
  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
